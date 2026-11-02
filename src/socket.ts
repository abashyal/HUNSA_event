import { io } from 'socket.io-client'

const socket = io(`http://${window.location.hostname}:3001`, {
  reconnectionDelay: 1000,
  reconnectionAttempts: Infinity,
})

export default socket
