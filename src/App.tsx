import React from 'react'
import useEventStore from './store/useEventStore'
import RoleSelect from './views/RoleSelect'
import LaptopView from './views/LaptopView'
import HostView from './views/HostView'
import CommitteeView from './views/CommitteeView'

export default function App() {
  const role = useEventStore((s) => s.role)

  if (role === null) return <RoleSelect />
  if (role === 'operator') return <LaptopView />
  if (role === 'host') return <HostView />
  if (role === 'committee') return <CommitteeView />

  return <RoleSelect />
}
