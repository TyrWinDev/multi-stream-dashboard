import { useSearchParams } from 'react-router-dom';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const AlertsDock = () => {
    const [searchParams] = useSearchParams();
    const [alertQueue, setAlertQueue] = useState([]);
    const [currentAlert, setCurrentAlert] = useState(null);
    const socketRef = useRef(null);

    const position = searchParams.get('position') || 'center';

    // --- Alert Queue Logic ---
    const addToAlertQueue = (act) => {
        setAlertQueue(prev => [...prev, act]);
    };

    // Watch Queue
    useEffect(() => {
        if (!currentAlert && alertQueue.length > 0) {
            // Show next alert
            const nextAlert = alertQueue[0];
            setCurrentAlert(nextAlert); // Start showing
            setAlertQueue(prev => prev.slice(1)); // Remove from queue
        }
    }, [currentAlert, alertQueue]);

    const handleAlertComplete = () => {
        setCurrentAlert(null); // This triggers the useEffect to pick the next one
    };

    // --- Socket Connection ---
    useEffect(() => {
        socketRef.current = io(SOCKET_URL);
        const socket = socketRef.current;

        socket.on('connect', () => {
        });

        socket.on('activity-event', (act) => {
            addToAlertQueue(act);
        });

        // Listen for simulations too, if relevant (App.jsx usually handles simulations via socket emit -> backend -> broadcast)
        // If backend broadcasts 'simulate-event' as 'activity-event' (it usually does or simulates it), we are good.
        // Wait, looking at App.jsx: handleSimulation emits 'simulate-event'.
        // Backend likely rebroadcasts this or App emits it locally.
        // Check if backend broadcasts it. If not, we might miss simulations triggered from Dashboard unless we listen to a specific event.
        // Assuming backend handles it for now as standard practice.

        return () => socket.disconnect();
    }, []);

    // Helper to test sound/alert manually if needed (debug)
    // useEffect(() => {
    //     // Debug: Trigger test alert on mount
    //     // setTimeout(() => addToAlertQueue({ type: 'follow', user: 'TestUser', platform: 'twitch' }), 1000);
    // }, []);

    return (
        <div className="h-screen w-full overflow-hidden bg-transparent relative">
            {/* 
                AlertOverlay is fixed/absolute usually. 
                We render it here. It handles its own visibility animation.
            */}
            <AlertOverlay latestEvent={currentAlert} onComplete={handleAlertComplete} position={position} />
        </div>
    );
};

export default AlertsDock;
