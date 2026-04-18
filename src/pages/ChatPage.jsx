import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'

export default function ChatPage({ token, user, onSignOut, onUpdateUser, theme, onToggleTheme }) {
  const [selectedConvoId, setSelectedConvoId] = useState(null)

  // Lifted state to trigger sidebar update
  const [newConvoTrigger, setNewConvoTrigger] = useState(0)

  function handleNewConversation(id) {
    setSelectedConvoId(id)

    setNewConvoTrigger(t => t + 1)
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        user={user}
        onSignOut={onSignOut}
        onUpdateUser={onUpdateUser}
        selectedConvoId={selectedConvoId}
        onSelectConvo={setSelectedConvoId}
        token={token}
        refreshTrigger={newConvoTrigger}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <ChatWindow
        selectedConvoId={selectedConvoId}
        token={token}
        onNewConvo={handleNewConversation}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    </div>
  )
}
