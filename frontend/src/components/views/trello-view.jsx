import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter, SortAsc } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const tasks = [
  {
    id: "TASK-1001",
    title: "Update homepage design",
    description: "Implement new hero section based on approved designs",
    status: "In Progress",
    priority: "High",
    assignee: "Alex Chen",
    dueDate: "Jul 20, 2023",
  },
  {
    id: "TASK-1002",
    title: "Fix login bug",
    description: "Users are experiencing issues with social login",
    status: "To Do",
    priority: "High",
    assignee: "Sarah Johnson",
    dueDate: "Jul 18, 2023",
  },
  {
    id: "TASK-1003",
    title: "Create API documentation",
    description: "Document all endpoints for the new API version",
    status: "Review",
    priority: "Medium",
    assignee: "Michael Brown",
    dueDate: "Jul 25, 2023",
  },
  {
    id: "TASK-1004",
    title: "Optimize database queries",
    description: "Improve performance of dashboard loading time",
    status: "In Progress",
    priority: "Medium",
    assignee: "Lisa Wong",
    dueDate: "Jul 22, 2023",
  },
  {
    id: "TASK-1005",
    title: "Set up analytics",
    description: "Implement Google Analytics and create custom events",
    status: "Done",
    priority: "Low",
    assignee: "David Miller",
    dueDate: "Jul 15, 2023",
  },
  {
    id: "TASK-1006",
    title: "User testing session",
    description: "Conduct user testing for new features",
    status: "To Do",
    priority: "High",
    assignee: "Emily Clark",
    dueDate: "Jul 28, 2023",
  },
]

const getStatusBadge = (status) => {
  switch (status) {
    case "To Do":
      return <Badge variant="outline">To Do</Badge>;
    case "In Progress":
      return <Badge variant="secondary">In Progress</Badge>;
    case "Review":
      return (
        <Badge variant="default" className="bg-amber-500">Review
                  </Badge>
      );
    case "Done":
      return (
        <Badge variant="default" className="bg-green-500">Done
                  </Badge>
      );
    default:
      return null
  }
}

const getPriorityBadge = (priority) => {
  switch (priority) {
    case "Low":
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-500">Low
                  </Badge>
      );
    case "Medium":
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-500">Medium
                  </Badge>
      );
    case "High":
      return (
        <Badge variant="outline" className="border-red-500 text-red-500">High
                  </Badge>
      );
    default:
      return null
  }
}

export default function TrelloView() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Trello</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm">
              {tasks.filter((task) => task.status === "To Do").length} To Do
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {tasks.filter((task) => task.status === "In Progress").length} In Progress
            </Badge>
            <Badge className="bg-amber-500 text-sm">
              {tasks.filter((task) => task.status === "Review").length} Review
            </Badge>
            <Badge className="bg-green-500 text-sm">{tasks.filter((task) => task.status === "Done").length} Done</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 pb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tasks..." className="pl-8" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="inprogress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <SortAsc className="h-4 w-4" />
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-mono text-xs">{task.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-muted-foreground">{task.description}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                    <TableCell>{task.assignee}</TableCell>
                    <TableCell>{task.dueDate}</TableCell>
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
