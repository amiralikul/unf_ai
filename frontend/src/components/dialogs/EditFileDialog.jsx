import * as React from "react"
import { Save, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"



export function EditFileDialog({ 
  open, 
  onOpenChange, 
  file, 
  onSave, 
  loading = false 
}) {
  const [formData, setFormData] = React.useState({
    name: ''
  })
  const [errors, setErrors] = React.useState({})

  // Initialize form data when file changes
  React.useEffect(() => {
    if (file) {
      setFormData({
        name: file.name || ''
      })
      setErrors({})
    }
  }, [file])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'File name is required'
    } else if (formData.name.trim().length < 1) {
      newErrors.name = 'File name must be at least 1 character'
    } else if (formData.name.trim().length > 255) {
      newErrors.name = 'File name must be less than 255 characters'
    }



    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onSave?.({
      id: file.id,
      name: formData.name.trim()
    })
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const hasChanges = file && formData.name !== file.name

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit File</DialogTitle>
          <DialogDescription>
            Make changes to your file metadata. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Name */}
          <div className="space-y-2">
            <Label htmlFor="fileName">File Name</Label>
            <Input
              id="fileName"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter file name"
              disabled={loading}
            />
            {errors.name && (
              <Alert variant="destructive">
                <AlertDescription>{errors.name}</AlertDescription>
              </Alert>
            )}
          </div>



          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !hasChanges}
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditFileDialog 