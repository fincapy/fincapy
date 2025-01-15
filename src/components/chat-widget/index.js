import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const isMobile = useIsMobile();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      setMessages([
        ...messages,
        { text: message, sender: 'user' },
        { text: 'Response', sender: 'assistant' },
      ]);
      setMessage('');
    }
  };

  return (
    <div className="fixed bottom-[45px] right-[5px] z-50">
      {isOpen ? (
        <Card className="w-80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-base">Chat Support</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <ScrollArea className="h-64">
            <CardContent className="p-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    'mb-4 flex',
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-lg px-4 py-2 max-w-[80%]',
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>
          </ScrollArea>
          <CardFooter className="p-4">
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
              <Input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export { ChatWidget };
