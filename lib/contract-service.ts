import { SupabaseClient } from '@supabase/supabase-js'

export interface ContractActionUser {
  id?: string
  name?: string
  nickname?: string
  email?: string
}

export function formatActorLabel(user?: ContractActionUser | null, role: 'Manager' | 'Admin' = 'Manager'): string {
  if (!user) return role === 'Manager' ? 'Manager del Equipo' : 'Administrador'
  const name = user.nickname || user.name || user.email
  if (!name) return role === 'Manager' ? 'Manager del Equipo' : 'Administrador'
  return `${name} (${role})`
}

/**
 * Aprueba un contrato y sincroniza bidireccionalmente:
 * 1. La tabla `contracts` (status: 'active', start_date)
 * 2. La tabla `validations` (status: 'active', audit details) para que el Administrador vea el estatus actualizado en tiempo real.
 */
export async function approveContractWithSync(
  supabase: SupabaseClient,
  params: {
    contractId: string
    playerId: string
    teamId: string
    managerUser?: ContractActionUser | null
    playerName?: string
    teamName?: string
  }
) {
  const { contractId, playerId, teamId, managerUser, playerName, teamName } = params
  const now = new Date().toISOString()
  const actorLabel = formatActorLabel(managerUser, 'Manager')

  // 1. Actualizar el contrato en la tabla contracts
  const { error: contractError } = await supabase
    .from('contracts')
    .update({
      status: 'active',
      start_date: now
    })
    .eq('id', contractId)

  if (contractError) {
    throw contractError
  }

  // 2. Sincronizar en la tabla validations para que el Administrador lo vea en su panel
  try {
    // Buscar validación registrada por contract_id
    let { data: valList } = await supabase
      .from('validations')
      .select('id, details, target_name, submitted_by')
      .eq('type', 'contrato')
      .filter('details->>contract_id', 'eq', contractId)

    // Fallback: si no se encontró por contract_id, buscar por player_id y team_id
    if (!valList || valList.length === 0) {
      const { data: fallbackVal } = await supabase
        .from('validations')
        .select('id, details, target_name, submitted_by')
        .eq('type', 'contrato')
        .filter('details->>player_id', 'eq', playerId)
        .filter('details->>team_id', 'eq', teamId)
      valList = fallbackVal
    }

    if (valList && valList.length > 0) {
      for (const valItem of valList) {
        await supabase
          .from('validations')
          .update({
            status: 'active',
            details: {
              ...(valItem.details || {}),
              contract_id: contractId,
              status: 'active',
              approved_by: actorLabel,
              approved_by_id: managerUser?.id || null,
              approved_by_email: managerUser?.email || null,
              approved_at: now,
              reviewed_by: actorLabel,
              reviewed_by_id: managerUser?.id || null,
              reviewed_at: now,
              manager_approved: true
            }
          })
          .eq('id', valItem.id)
      }
    } else {
      // Si no existía validación previa, insertamos una para registrar la auditoría en el panel administrativo
      const pName = playerName || 'Jugador'
      const tName = teamName || 'Equipo'
      await supabase
        .from('validations')
        .insert({
          type: 'contrato',
          target_name: `${pName} ➔ ${tName} (Contrato)`,
          submitted_by: pName,
          status: 'active',
          details: {
            contract_id: contractId,
            player_id: playerId,
            player_name: pName,
            team_id: teamId,
            team_name: tName,
            status: 'active',
            approved_by: actorLabel,
            approved_by_id: managerUser?.id || null,
            approved_by_email: managerUser?.email || null,
            approved_at: now,
            reviewed_by: actorLabel,
            reviewed_by_id: managerUser?.id || null,
            reviewed_at: now,
            manager_approved: true
          }
        })
    }
  } catch (valErr) {
    console.warn('Advertencia al sincronizar validación de contrato con el administrador:', valErr)
  }

  return { success: true }
}

/**
 * Rechaza un contrato y sincroniza bidireccionalmente contracts y validations.
 */
export async function rejectContractWithSync(
  supabase: SupabaseClient,
  params: {
    contractId: string
    playerId?: string
    teamId?: string
    managerUser?: ContractActionUser | null
    reason?: string
  }
) {
  const { contractId, playerId, teamId, managerUser, reason } = params
  const now = new Date().toISOString()
  const actorLabel = formatActorLabel(managerUser, 'Manager')
  const rejectionReasonText = reason || 'Rechazado por el manager del equipo'

  // 1. Actualizar contracts
  const { error: contractError } = await supabase
    .from('contracts')
    .update({
      status: 'rejected'
    })
    .eq('id', contractId)

  if (contractError) {
    throw contractError
  }

  // 2. Sincronizar validations
  try {
    let { data: valList } = await supabase
      .from('validations')
      .select('id, details')
      .eq('type', 'contrato')
      .filter('details->>contract_id', 'eq', contractId)

    if ((!valList || valList.length === 0) && playerId && teamId) {
      const { data: fallbackVal } = await supabase
        .from('validations')
        .select('id, details')
        .eq('type', 'contrato')
        .filter('details->>player_id', 'eq', playerId)
        .filter('details->>team_id', 'eq', teamId)
      valList = fallbackVal
    }

    if (valList && valList.length > 0) {
      for (const valItem of valList) {
        await supabase
          .from('validations')
          .update({
            status: 'rejected',
            details: {
              ...(valItem.details || {}),
              contract_id: contractId,
              status: 'rejected',
              rejected_by: actorLabel,
              rejected_by_id: managerUser?.id || null,
              rejected_by_email: managerUser?.email || null,
              rejected_at: now,
              reviewed_by: actorLabel,
              reviewed_by_id: managerUser?.id || null,
              reviewed_at: now,
              rejection_reason: rejectionReasonText,
              manager_rejected: true
            }
          })
          .eq('id', valItem.id)
      }
    }
  } catch (valErr) {
    console.warn('Advertencia al sincronizar rechazo de validación con el administrador:', valErr)
  }

  return { success: true }
}

/**
 * Acepta la solicitud de baja de contrato y sincroniza tanto contracts como validations (baja_contrato).
 */
export async function approveReleaseWithSync(
  supabase: SupabaseClient,
  params: {
    contractId: string
    managerUser?: ContractActionUser | null
  }
) {
  const { contractId, managerUser } = params
  const now = new Date().toISOString()
  const actorLabel = formatActorLabel(managerUser, 'Manager')

  const { error: contractError } = await supabase
    .from('contracts')
    .update({
      status: 'completado',
      conclusion_date: now
    })
    .eq('id', contractId)

  if (contractError) throw contractError

  try {
    const { data: valList } = await supabase
      .from('validations')
      .select('id, details')
      .eq('type', 'baja_contrato')
      .filter('details->>contract_id', 'eq', contractId)

    if (valList && valList.length > 0) {
      for (const valItem of valList) {
        await supabase
          .from('validations')
          .update({
            status: 'active',
            details: {
              ...(valItem.details || {}),
              status: 'active',
              approved_by: actorLabel,
              approved_by_id: managerUser?.id || null,
              approved_by_email: managerUser?.email || null,
              approved_at: now,
              reviewed_by: actorLabel,
              reviewed_by_id: managerUser?.id || null,
              reviewed_at: now
            }
          })
          .eq('id', valItem.id)
      }
    }
  } catch (valErr) {
    console.warn('Advertencia al sincronizar baja con el administrador:', valErr)
  }

  return { success: true }
}

/**
 * Rechaza la solicitud de baja de contrato y sincroniza contracts y validations (baja_contrato).
 */
export async function rejectReleaseWithSync(
  supabase: SupabaseClient,
  params: {
    contractId: string
    managerUser?: ContractActionUser | null
    reason?: string
  }
) {
  const { contractId, managerUser, reason } = params
  const now = new Date().toISOString()
  const actorLabel = formatActorLabel(managerUser, 'Manager')

  const { error: contractError } = await supabase
    .from('contracts')
    .update({
      status: 'active'
    })
    .eq('id', contractId)

  if (contractError) throw contractError

  try {
    const { data: valList } = await supabase
      .from('validations')
      .select('id, details')
      .eq('type', 'baja_contrato')
      .filter('details->>contract_id', 'eq', contractId)

    if (valList && valList.length > 0) {
      for (const valItem of valList) {
        await supabase
          .from('validations')
          .update({
            status: 'rejected',
            details: {
              ...(valItem.details || {}),
              status: 'rejected',
              rejected_by: actorLabel,
              rejected_by_id: managerUser?.id || null,
              rejected_by_email: managerUser?.email || null,
              rejected_at: now,
              reviewed_by: actorLabel,
              reviewed_by_id: managerUser?.id || null,
              reviewed_at: now,
              rejection_reason: reason || 'Baja rechazada por el manager'
            }
          })
          .eq('id', valItem.id)
      }
    }
  } catch (valErr) {
    console.warn('Advertencia al sincronizar rechazo de baja con el administrador:', valErr)
  }

  return { success: true }
}
