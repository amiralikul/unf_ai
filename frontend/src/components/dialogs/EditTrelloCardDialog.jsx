import * as React from "react"
import { BarChart3, Save, X, Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function EditTrelloCardDialog({ 
  open, 
  onOpenChange, 
  card, 
  onSave, 
  loading = false 
}) {
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    priority: '',
    dueDate: ''
  })
  const [errors, setErrors] = React.useState({})

  // Update form data when card changes
  React.useEffect(() => {
    if (card) {
      setFormData({
        name: card.name || '',
        description: card.description || '',
        priority: card.priority || 'none',
        dueDate: card.dueDate ? new Date(card.dueDate).toISOString().slice(0, 16) : ''
      })
      setErrors({})
    }
  }, [card])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Card name is required'
    } else if (formData.name.length > 255) {
      newErrors.name = 'Card name must be less than 255 characters'
    }
    
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const updateData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      priority: formData.priority === 'none' ? null : formData.priority || null,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
    }

    // Remove unchanged fields to avoid unnecessary updates
    const changedData = {}
    if (updateData.name !== card.name) changedData.name = updateData.name
    if (updateData.description !== (card.description || '')) changedData.description = updateData.description
    if (updateData.priority !== (card.priority || null)) changedData.priority = updateData.priority
    
    // Handle date comparison carefully
    const originalDate = card.dueDate ? new Date(card.dueDate).toISOString() : null
    if (updateData.dueDate !== originalDate) changedData.dueDate = updateData.dueDate

    // Only save if there are actual changes
    if (Object.keys(changedData).length > 0) {
      onSave?.({ id: card.id, ...changedData })
    } else {
      // No changes, just close the dialog
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    setErrors({})
    onOpenChange(false)
  }

  if (!card) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Edit Trello Card
          </DialogTitle>
          <DialogDescription>
            Make changes to the card details
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <form onSubmit={handleSubmit} className="space-y-4 pr-2">
          {/* Card Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Card Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter card name"
              disabled={loading}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter card description"
              disabled={loading}
              rows={4}
              className={`resize-none ${errors.description ? "border-destructive" : ""}`}
              style={{ maxHeight: '200px' }}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Priority</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <div className="relative">
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                disabled={loading}
              />
              <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Error Alert */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please fix the errors above before saving.
              </AlertDescription>
            </Alert>
          )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className="flex-1"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EditTrelloCardDialog 