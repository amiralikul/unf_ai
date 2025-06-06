import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { File, FileText, Folder, ImageIcon, Search, Upload, FolderPlus, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const driveItems = [
  {
    id: "1",
    name: "Project Documents",
    type: "folder",
    size: "--",
    modified: "Jul 15, 2023",
    shared: true,
  },
  {
    id: "2",
    name: "Quarterly Report.docx",
    type: "document",
    size: "2.4 MB",
    modified: "Jul 12, 2023",
    shared: false,
  },
  {
    id: "3",
    name: "Team Photo.jpg",
    type: "image",
    size: "5.1 MB",
    modified: "Jun 30, 2023",
    shared: true,
  },
  {
    id: "4",
    name: "Marketing Assets",
    type: "folder",
    size: "--",
    modified: "Jun 28, 2023",
    shared: true,
  },
  {
    id: "5",
    name: "Budget.xlsx",
    type: "document",
    size: "1.8 MB",
    modified: "Jun 25, 2023",
    shared: false,
  },
  {
    id: "6",
    name: "Presentation.pptx",
    type: "document",
    size: "4.2 MB",
    modified: "Jun 20, 2023",
    shared: true,
  },
]

const getFileIcon = (type) => {
  switch (type) {
    case "folder":
      return <Folder className="h-5 w-5 text-blue-500" />;
    case "document":
      return <FileText className="h-5 w-5 text-green-500" />;
    case "image":
      return <ImageIcon className="h-5 w-5 text-purple-500" />;
    default:
      return <File className="h-5 w-5 text-gray-500" />;
  }
}

export default function DriveView() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Google Drive</CardTitle>
          <Badge variant="outline" className="text-sm">
            {driveItems.length} items
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 pb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search files..." className="pl-8" />
            </div>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
            <Button variant="outline">
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead className="w-[100px]">Shared</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driveItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(item.type)}
                        <span>{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>{item.modified}</TableCell>
                    <TableCell>
                      {item.shared ? (
                        <Badge variant="secondary">Shared</Badge>
                      ) : (
                        <span className="text-muted-foreground">Private</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Download</DropdownMenuItem>
                          <DropdownMenuItem>Rename</DropdownMenuItem>
                          <DropdownMenuItem>Share</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
