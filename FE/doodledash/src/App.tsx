import { useEffect, useRef, useState } from 'react';
import {
  HubConnectionBuilder,
  HubConnection,
  LogLevel,
} from '@microsoft/signalr';

interface ChatMessage {
  user: string;
  message: string;
}

const App = () => {
  const connectionRef = useRef<HubConnection | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5103/doodleDash')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connection.on('ReceiveMessage', (user: string, msg: string) => {
      setMessages((prev) => [...prev, { user, message: msg }]);
    });

    connectionRef.current = connection;

    connection
      .start()
      .then(() => console.log('SignalR connected'))
      .catch((err) => console.error('SignalR connection error:', err));

    return () => {
      connection.off('ReceiveMessage');
      connection.stop();
    };
  }, []);

  const handleSend = () => {
    if (connectionRef.current && message.trim()) {
      connectionRef.current
        .invoke('SendMessage', 'User', message)
        .catch((err) => console.error('SendMessage error:', err));
      setMessage('');
    }
  };

  return (
    <div className="content">
      <h1>Rsbuild with React</h1>
      <div>
        {messages.map((msg, i) => (
          <p key={i}>
            <strong>{msg.user}:</strong> {msg.message}
          </p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Type a message..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
};

export default App;
