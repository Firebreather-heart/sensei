export interface VirtualFile {
    id: string
    name: string
    content: string
    directory: boolean
    public: boolean
    can_view: string[]
    can_edit: string[]
    created_at: string
    updated_at: string
    root: string
    children?: string[]
    parent?: string | null
}