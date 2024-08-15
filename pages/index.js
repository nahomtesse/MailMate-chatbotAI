import Head from 'next/head';
import styles from '../styles/Home.module.css';
import React, { useState } from 'react';
import OpenAI from "openai"
import Handlebars from 'handlebars'
import { Spinner } from 'react-spinners';
import ClipLoader from "react-spinners/ClipLoader";
require('dotenv').config();

export default function Home() {

      const [messages, setMessages] = useState([
        { id: 1, text: 'Hello! How can I assist you with creating your email today?', sender: 'bot' }
      ]);
      const [input, setInput] = useState('');     

      const [loading, setLoading] = useState(false);

    
      const openai = new OpenAI({
        dangerouslyAllowBrowser: true,
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      })

      const emailTemplate = Handlebars.compile(`
        <html>
          <head>
            <title>{{subject}}</title>
          </head>
          <body>
            <h3>{{subject}}</h3>
            <p>Dear {{name}},</p>
            <p>{{body}}</p>
            <p>Best,</p>
            <p>{{sender}}</p>
          </body>
        </html>
      `);

      const getBotResponse = async (message) => {
        try {
          const completion = await openai.chat.completions.create({
            model: "meta-llama/llama-3.1-8b-instruct:free",
            messages: [
              { role: "user", content: message }
            ],
          });
          const response = completion.choices[0].message.content; 

        
          const emailData = {
            subject: response.split("Dear")[0].trim(),
            name: response.split("Dear")[1] ? response.split("Dear")[1].split(",")[0].trim() : "",
            body: response.split("Best")[0].trim(),
            sender: response.split("Best,")[1] ? response.split("Best,")[1].trim() : "",
          };
          

          const emailHtml = emailTemplate(emailData);
          return emailHtml;

        } catch (error) {
          console.error("Error fetching bot response:", error);
          return "Sorry, something went wrong.";
        }
      };

      const handleSend = async () => {
        setLoading(true);


        if (input.trim() !== '') {
          const newMessage = { id: messages.length + 1, text: input.trim(), sender: 'user' };
          setMessages([...messages, newMessage]);
          setInput('');

          const botMessageText = await getBotResponse(`Help me create an email based on this: ${input.trim()}`);
          setLoading(false);

          setTimeout(() => {
            const botMessage = { id: messages.length + 2, text: botMessageText, sender: 'bot' };
            setMessages((prevMessages) => [...prevMessages, botMessage]);
          }, 1000);
        }
      };


  return (
    <div className={styles.container}>
      <Head>
        <title>Mail Mate AI chatbot</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className={styles.title}>
          Welcome! 
        </h1>

        <p className={styles.description}>
          My name is Mail Mate, Your Friendly Email Assistant.
        </p>

        <div className={styles.grid}>
         <div className={styles.chatContainer}>
          <div className={styles.messagesContainer}>
            {messages.map((message) => (
              <div key={message.id} className={message.sender === 'bot' ? styles.botMessage : styles.userMessage}>
                {loading && <ClipLoader size={15} color="#3f3e3e"/>}
                {message.sender === 'bot' ? (
                    <div dangerouslySetInnerHTML={{ __html: message.text }} />
                  ) : (
                    message.text
                  )}
              </div>
            ))}
            </div>
              <div className={styles.inputContainer}>
                <input type="text" className={styles.messageInput} placeholder="Type your message..."  value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
                <button type="button" className={styles.sendButton} onClick={handleSend}>Send</button>
              </div>
            </div>
          </div>          
      </main>

      <footer>
        <div class="footer-content">
            <p>© 2024 Nahom Geda. All rights reserved.</p>
        </div>
      </footer>


      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          height: 100%,
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            Segoe UI,
            Roboto,
            Oxygen,
            Ubuntu,
            Cantarell,
            Fira Sans,
            Droid Sans,
            Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        },

        footer {
          background-color: #333;
          color: #fff;
          text-align: center;
          padding: 20px 0;
          position: fixed;
          width: 100%;
          bottom: 0;
        }
      `}</style>
    </div>
  );
}
