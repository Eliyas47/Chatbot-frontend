import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'

export default function ChatPage({ token, user, onSignOut, onUpdateUser }) {
  const [selectedConvoId, setSelectedConvoId] = useState(null)

  // Lifted state to trigger sidebar update
  const [newConvoTrigger, setNewConvoTrigger] = useState(0)

  function handleNewConversation(id, title) {
    // Determine title if not provided (e.g. from first message)
    const newTitle = title || 'New Chat'

    // update localStorage
    const current = JSON.parse(localStorage.getItem('convos') || '[]')
    const next = [{ id, title: newTitle }, ...current]
    localStorage.setItem('convos', JSON.stringify(next))

    // Select it
    setSelectedConvoId(id)

    // Trigger sidebar reload (simplest way without complex state management)
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
      />
      <ChatWindow
        selectedConvoId={selectedConvoId}
        token={token}
        onNewConvo={handleNewConversation}
      />
    </div>
  )
}
