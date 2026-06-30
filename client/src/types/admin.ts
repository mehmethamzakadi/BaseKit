/** /admin/users öğesi. */
export interface UserDto {
  id: string
  email: string | null
  displayName: string | null
  roles: string[]
  isActive: boolean
}

/** /admin/roles öğesi. */
export interface RoleDto {
  id: string
  name: string
  description: string | null
  permissions: string[]
}

/** /admin/permissions — tek yetki. */
export interface PermissionItemDto {
  name: string
  displayName: string
}

/** /admin/permissions — gruplanmış yetkiler. */
export interface PermissionGroupDto {
  group: string
  items: PermissionItemDto[]
}
