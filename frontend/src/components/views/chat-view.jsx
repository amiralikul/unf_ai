import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendHorizontal, Settings, Paperclip, Smile } from "lucide-react"
import { useNLToSQL } from "@/hooks/useAI"

export default function ChatView() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      content: "Hello! I can help you analyze your data using natural language queries. Ask me questions like 'How many files do I have?' or 'Show me my recent emails'.",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const nlToSQLMutation = useNLToSQL()
  const isLoading = nlToSQLMutation.isPending

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")

    try {
      // Call the NL-to-SQL API
      const response = await nlToSQLMutation.mutateAsync(currentInput)
      
      const aiMessage = {
        id: Date.now().toString(),
        content: response.answer,
        sender: "ai",
        timestamp: new Date(),
        sqlInfo: response.sql, // Store SQL info for debugging/display
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error('Failed to process query:', error)
      
      const errorMessage = {
        id: Date.now().toString(),
        content: `Sorry, I encountered an error: ${error.message || 'Failed to process your query'}. Please try again.`,
        sender: "ai",
        timestamp: new Date(),
        isError: true,
      }

      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="p-6">
      <Card className="flex h-[calc(100vh-120px)] flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>AI Chat Assistant</CardTitle>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[calc(100vh-240px)] px-4">
            <div className="space-y-4 pt-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex max-w-[80%] items-start gap-3 rounded-lg p-4 ${
                      message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                    {message.sender === "ai" && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>
                      <p className="mt-1 text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.sender === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" />
                        <AvatarFallback>You</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex max-w-[80%] items-center gap-3 rounded-lg bg-muted p-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]"></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="shrink-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="min-h-[60px] flex-1 resize-none"
                disabled={isLoading} />
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="icon" className="shrink-0">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="shrink-0">
                  <SendHorizontal className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
