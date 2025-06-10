import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card.jsx";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible.jsx";
import { SendHorizontal, Settings, ChevronDown, Code, Zap } from "lucide-react";
import { useNLToSQL } from "@/hooks/useAI.js";
import { useAutoScroll } from "@/hooks/useAutoScroll.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table.jsx";
import "@/assets/custom-scrollbar.css";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      content:
        "Hello! I can help you analyze your data using natural language queries powered by LangChain. Ask me questions like 'How many files do I have?' or 'Show me my recent emails'.",
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const nlToSQLMutation = useNLToSQL();
  const isLoading = nlToSQLMutation.isPending;
  const { scrollAreaRef, scrollTargetRef, scrollToBottom } = useAutoScroll(messages);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");

    try {
      // Call the NL-to-SQL API (now powered by LangChain)
      const response = await nlToSQLMutation.mutateAsync(currentInput);

      const aiMessage = {
        id: Date.now().toString(),
        content: response.answer,
        sender: "ai",
        timestamp: new Date(),
        sqlInfo: response.sql // Store SQL info for debugging/display
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to process query:", error);

      const errorMessage = {
        id: Date.now().toString(),
        content: `Sorry, I encountered an error: ${error.response?.data?.message || error.message || "Failed to process your query"}. Please try again.`,
        sender: "ai",
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper function to render SQL query results as a table
  const renderSQLTable = sqlInfo => {
    if (!sqlInfo || !sqlInfo.results || sqlInfo.results.length === 0) {
      return null;
    }

    const headers = Object.keys(sqlInfo.results[0]);
    const rows = sqlInfo.results;

    return (
      <div className="mt-4 rounded-lg border">
        <div className="max-h-64 overflow-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map(header => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {headers.map(header => (
                    <TableCell key={`${rowIndex}-${header}`}>
                      {header.toLowerCase().includes("date") || header.toLowerCase().includes("at")
                        ? format(new Date(row[header]), "PPPpp")
                        : typeof row[header] === "object" && row[header] !== null
                          ? JSON.stringify(row[header])
                          : String(row[header])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  // Helper function to render SQL info
  const renderSQLInfo = sqlInfo => {
    if (!sqlInfo) return null;

    return (
      <Collapsible className="mt-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-auto p-1 text-xs">
            <Code className="h-3 w-3 mr-1" />
            View SQL Details
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="rounded border bg-muted/50 p-3 text-xs">
            <div className="mb-2">
              <strong>SQL Query:</strong>
              <code className="mt-1 block rounded bg-background p-2 font-mono text-xs">
                {sqlInfo.query}
              </code>
            </div>
            <div className="mb-2">
              <strong>Explanation:</strong>
              <p className="mt-1 text-muted-foreground">{sqlInfo.explanation}</p>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Results: {sqlInfo.resultCount}</span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Powered by LangChain
              </span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="p-6 pb-60">
      <Card className="flex h-[calc(100vh-350px)] flex-col">
        <CardHeader className="pb-2">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              AI Chat Assistant
              <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                <Zap className="h-4 w-4" />
                Powered by LangChain
              </span>
            </CardTitle>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea ref={scrollAreaRef} className="h-[calc(100vh-450px)] px-4">
            <div className="space-y-4 pt-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[90%] items-start gap-3 rounded-lg p-4 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : message.isError
                          ? "bg-red-50 border border-red-200"
                          : "bg-muted"
                    }`}
                  >
                    {message.sender === "ai" && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{message.content}</p>

                      {/* Render SQL results table */}
                      {message.sqlInfo && renderSQLTable(message.sqlInfo)}

                      <p className="mt-1 text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>

                      {/* Render SQL info */}
                      {message.sqlInfo && renderSQLInfo(message.sqlInfo)}
                    </div>
                    {message.sender === "user" && (
                      <Avatar className="h-8 w-8 shrink-0">
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
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Invisible element to scroll to */}
              <div ref={scrollTargetRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <Card className="mb-6 absolute bottom-0 left-6 right-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t shadow-lg">
        <CardContent className="p-4 flex-col">
          <div className="w-full space-y-3">
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">Try these sample questions:</p>
              <div className="flex flex-wrap gap-1">
                {[
                  "Who owns the most files?",
                  "Which file was modified most recently?",
                  "What is the distribution of files by their last modified date?",
                  "Which files have been shared via email but not modified recently?",
                  "Who sends the most file-related emails?",
                  "Which Trello cards are linked to recently modified files?",
                  "What percentage of tasks have corresponding documents?",
                  "Are there overdue tasks with active email conversations?"
                ].map((sample, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => setInput(sample)}
                    className="h-6 px-2 text-xs"
                    disabled={isLoading}
                  >
                    {sample}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 w-full items-end">
              <div className="flex-1 min-w-0">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your data..."
                  className="min-h-[60px] w-full resize-none"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="shrink-0"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
                <span className="sr-only">Send message</span>
              </Button>
            </div>

            {/* Status indicator */}
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>LangChain-powered AI assistant</span>
              </div>
              {isLoading && (
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
                  Processing...
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
