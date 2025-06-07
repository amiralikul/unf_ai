import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SendHorizontal,
  Settings,
  Paperclip,
  Smile,
  ChevronDown,
  Code,
  GitCompare,
  Zap,
  Database,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { useNLToSQL, useLangChainNLToSQL, useCompareNLToSQL } from "@/hooks/useAI"

export default function ChatView() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      content: "Hello! I can help you analyze your data using natural language queries. You can choose between different AI implementations or compare them side-by-side. Ask me questions like 'How many files do I have?' or 'Show me my recent emails'.",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [queryMethod, setQueryMethod] = useState("original") // "original", "langchain", "compare"

  // Hooks for different implementations
  const nlToSQLMutation = useNLToSQL()
  const langchainMutation = useLangChainNLToSQL()
  const compareMutation = useCompareNLToSQL()

  const isLoading = nlToSQLMutation.isPending || langchainMutation.isPending || compareMutation.isPending

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
      queryMethod,
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")

    try {
      let response;
      let aiMessage;

      if (queryMethod === "compare") {
        // Compare both implementations
        response = await compareMutation.mutateAsync(currentInput)

        aiMessage = {
          id: Date.now().toString(),
          content: "Here's a comparison of both implementations:",
          sender: "ai",
          timestamp: new Date(),
          queryMethod: "compare",
          comparisonData: response,
        }
      } else if (queryMethod === "langchain") {
        // Use LangChain implementation
        response = await langchainMutation.mutateAsync(currentInput)

        aiMessage = {
          id: Date.now().toString(),
          content: response.answer,
          sender: "ai",
          timestamp: new Date(),
          queryMethod: "langchain",
          sqlInfo: response.sql,
        }
      } else {
        // Use original implementation
        response = await nlToSQLMutation.mutateAsync(currentInput)

        aiMessage = {
          id: Date.now().toString(),
          content: response.answer,
          sender: "ai",
          timestamp: new Date(),
          queryMethod: "original",
          sqlInfo: response.sql,
        }
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error('Failed to process query:', error)

      const errorMessage = {
        id: Date.now().toString(),
        content: `Sorry, I encountered an error: ${error.response?.data?.message || error.message || 'Failed to process your query'}. Please try again.`,
        sender: "ai",
        timestamp: new Date(),
        isError: true,
        queryMethod,
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

  // Helper function to get method badge
  const getMethodBadge = (method) => {
    switch (method) {
      case "langchain":
        return <Badge variant="secondary" className="ml-2"><Zap className="h-3 w-3 mr-1" />LangChain</Badge>
      case "compare":
        return <Badge variant="outline" className="ml-2"><GitCompare className="h-3 w-3 mr-1" />Compare</Badge>
      default:
        return <Badge variant="default" className="ml-2"><Database className="h-3 w-3 mr-1" />Original</Badge>
    }
  }

  // Helper function to render SQL info
  const renderSQLInfo = (sqlInfo, method) => {
    if (!sqlInfo) return null

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
              {method && <span>Method: {method}</span>}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  // Helper function to render comparison data
  const renderComparisonData = (comparisonData) => {
    if (!comparisonData) return null

    const { original, langchain, comparison } = comparisonData

    return (
      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Original Implementation */}
          <div className={`rounded border p-3 ${original?.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4" />
              <span className="font-medium text-sm">Original</span>
              {original?.success ?
                <CheckCircle className="h-4 w-4 text-green-600" /> :
                <XCircle className="h-4 w-4 text-red-600" />
              }
            </div>
            {original?.success ? (
              <div className="space-y-2 text-xs">
                <p><strong>Answer:</strong> {original.response}</p>
                <p><strong>Results:</strong> {original.resultCount}</p>
                <code className="block rounded bg-background p-2 font-mono">
                  {original.sql}
                </code>
              </div>
            ) : (
              <p className="text-red-600 text-xs">{original?.error}</p>
            )}
          </div>

          {/* LangChain Implementation */}
          <div className={`rounded border p-3 ${langchain?.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4" />
              <span className="font-medium text-sm">LangChain</span>
              {langchain?.success ?
                <CheckCircle className="h-4 w-4 text-green-600" /> :
                <XCircle className="h-4 w-4 text-red-600" />
              }
            </div>
            {langchain?.success ? (
              <div className="space-y-2 text-xs">
                <p><strong>Answer:</strong> {langchain.response}</p>
                <p><strong>Results:</strong> {langchain.resultCount}</p>
                <code className="block rounded bg-background p-2 font-mono">
                  {langchain.sql}
                </code>
              </div>
            ) : (
              <p className="text-red-600 text-xs">{langchain?.error}</p>
            )}
          </div>
        </div>

        {/* Comparison Summary */}
        {comparison && (
          <div className="rounded border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <GitCompare className="h-4 w-4" />
              <span className="font-medium text-sm">Comparison Summary</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span>Both Successful:</span>
                {comparison.bothSuccessful ?
                  <CheckCircle className="h-3 w-3 text-green-600" /> :
                  <XCircle className="h-3 w-3 text-red-600" />
                }
              </div>
              {comparison.bothSuccessful && (
                <>
                  <div className="flex items-center gap-2">
                    <span>SQL Similarity:</span>
                    {comparison.sqlSimilarity ?
                      <CheckCircle className="h-3 w-3 text-green-600" /> :
                      <AlertCircle className="h-3 w-3 text-yellow-600" />
                    }
                    <span className="text-muted-foreground">
                      {comparison.sqlSimilarity ? 'Identical' : 'Different approaches'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Result Count:</span>
                    {comparison.resultCountMatch ?
                      <CheckCircle className="h-3 w-3 text-green-600" /> :
                      <AlertCircle className="h-3 w-3 text-yellow-600" />
                    }
                    <span className="text-muted-foreground">
                      {comparison.resultCountMatch ? 'Same count' : 'Different counts'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6">
      <Card className="flex h-[calc(100vh-120px)] flex-col">
        <CardHeader className="pb-2">
          <div className="flex flex-row items-center justify-between">
            <CardTitle>AI Chat Assistant</CardTitle>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Method Selector */}
          <div className="mt-3">
            <Tabs value={queryMethod} onValueChange={setQueryMethod} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="original" className="text-xs">
                  <Database className="h-3 w-3 mr-1" />
                  Original
                </TabsTrigger>
                <TabsTrigger value="langchain" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  LangChain
                </TabsTrigger>
                <TabsTrigger value="compare" className="text-xs">
                  <GitCompare className="h-3 w-3 mr-1" />
                  Compare
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Method Description */}
            <div className="mt-2 text-xs text-muted-foreground">
              {queryMethod === "original" && "Uses the original OpenAI-based implementation"}
              {queryMethod === "langchain" && "Uses the advanced LangChain implementation with better prompt engineering"}
              {queryMethod === "compare" && "Compares both implementations side-by-side"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[calc(100vh-320px)] px-4">
            <div className="space-y-4 pt-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex max-w-[90%] items-start gap-3 rounded-lg p-4 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : message.isError
                          ? "bg-red-50 border border-red-200"
                          : "bg-muted"
                    }`}>
                    {message.sender === "ai" && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm">{message.content}</p>
                        {message.queryMethod && getMethodBadge(message.queryMethod)}
                      </div>

                      <p className="mt-1 text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      {/* Render SQL info for single method responses */}
                      {message.sqlInfo && renderSQLInfo(message.sqlInfo, message.queryMethod)}

                      {/* Render comparison data */}
                      {message.comparisonData && renderComparisonData(message.comparisonData)}
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
            {/* Sample Questions */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">Try these sample questions:</p>
              <div className="flex flex-wrap gap-1">
                {[
                  "How many files do I have?",
                  "Show me my recent emails",
                  "What are my Trello cards?",
                  "Count my files by type"
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

            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="shrink-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask a question using ${queryMethod === 'compare' ? 'comparison mode' : queryMethod === 'langchain' ? 'LangChain' : 'original'} method...`}
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
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  ) : (
                    <SendHorizontal className="h-4 w-4" />
                  )}
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </div>

            {/* Current method indicator */}
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>Using:</span>
                {getMethodBadge(queryMethod)}
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
