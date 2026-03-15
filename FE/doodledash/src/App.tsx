import './App.css'
import Room from './pages/Room'
import Home from './pages/Home'
import GameConfig from './pages/GameConfig'
import { useLocalInputs, type InputStore } from './store/inputStore'

function renderScreen(screenType: InputStore['currentScreen']) {
    switch (screenType) {
        case 'HOME':
            return <Home />
        case 'GAMECONFIG':
            return <GameConfig />
        case 'ROOM':
            return <Room />
    }
}

export default function App() {
    const currentScreen = useLocalInputs((state) => state.currentScreen)

    return (
        <div className="gradient-bg h-full">{renderScreen(currentScreen)}</div>
    )
}
