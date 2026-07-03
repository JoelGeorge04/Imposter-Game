import React, { useMemo, useRef, useState } from "react";
import "./App.css";

const WORD_PAIRS = [
    { citizens: "Pizza", imposter: "Burger" },
    { citizens: "Cat", imposter: "Tiger" },
    { citizens: "Apple", imposter: "Orange" },
    { citizens: "Coffee", imposter: "Tea" },
    { citizens: "Car", imposter: "Truck" },
    { citizens: "Ocean", imposter: "Sea" },
    { citizens: "Book", imposter: "Magazine" },
    { citizens: "Sun", imposter: "Moon" },
    { citizens: "Piano", imposter: "Guitar" },
    { citizens: "Rose", imposter: "Tulip" }
];

const DEFAULT_PLAYERS = ["Joel", "Jbt", "Bbt", "Dinu", "Prince", "Eljo", "Aivin", "Aromal", "Abhiram", "Deon", "Jimmy"];

function shuffle(list) {
    const items = [...list];
    for (let index = items.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
    }
    return items;
}

function pickWordPair() {
    return WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
}

function buildGame(players) {
    const pair = pickWordPair();
    const imposterIndex = Math.floor(Math.random() * players.length);
    const gamePlayers = players.map((name, index) => ({
        name,
        word: index === imposterIndex ? pair.imposter : pair.citizens,
        isImposter: index === imposterIndex
    }));

    return {
        players: shuffle(gamePlayers),
        citizensWord: pair.citizens,
        imposterWord: pair.imposter
    };
}

function App() {
    const [availablePlayers, setAvailablePlayers] = useState(DEFAULT_PLAYERS);
    const [manualPlayerName, setManualPlayerName] = useState("");
    const [error, setError] = useState("");
    const [phase, setPhase] = useState("setup");
    const [game, setGame] = useState(null);
    const [revealIndex, setRevealIndex] = useState(0);
    const [showWord, setShowWord] = useState(false);
    const [revealConfirm, setRevealConfirm] = useState(false);
    const [revealDirection, setRevealDirection] = useState("next");
    const [touchStartX, setTouchStartX] = useState(null);
    const suppressNextClickRef = useRef(false);

    const allPlayers = useMemo(
        () => Array.from(new Set([...DEFAULT_PLAYERS, ...availablePlayers.filter((player) => !DEFAULT_PLAYERS.includes(player))])),
        [availablePlayers]
    );
    const playerList = game?.players || [];
    const currentRevealPlayer = playerList[revealIndex];
    const revealedImposter = playerList.find((player) => player.isImposter);

    const restartGame = () => {
        setPhase("setup");
        setGame(null);
        setError("");
        setRevealIndex(0);
        setShowWord(false);
        setRevealConfirm(false);
        setRevealDirection("next");
        setTouchStartX(null);
        setManualPlayerName("");
        suppressNextClickRef.current = false;
    };

    const startGame = () => {
        if (availablePlayers.length < 3) {
            setError("Select at least 3 available players.");
            return;
        }

        setError("");
        setGame(buildGame(availablePlayers));
        setPhase("reveal");
        setRevealIndex(0);
        setShowWord(false);
        setRevealConfirm(false);
        setRevealDirection("next");
        setTouchStartX(null);
        suppressNextClickRef.current = false;
    };

    const togglePlayerAvailability = (playerName) => {
        setAvailablePlayers((currentPlayers) => (
            currentPlayers.includes(playerName)
                ? currentPlayers.filter((name) => name !== playerName)
                : [...currentPlayers, playerName]
        ));
    };

    const addManualPlayer = () => {
        const trimmedName = manualPlayerName.trim();
        if (!trimmedName) {
            return;
        }

        const alreadyExists = allPlayers.some((player) => player.toLowerCase() === trimmedName.toLowerCase());
        if (alreadyExists) {
            setManualPlayerName("");
            return;
        }

        setAvailablePlayers((currentPlayers) => [...currentPlayers, trimmedName]);
        setManualPlayerName("");
    };

    const moveToNextReveal = () => {
        const nextIndex = revealIndex + 1;
        if (nextIndex >= playerList.length) {
            setPhase("results");
            return;
        }

        setRevealDirection("next");
        setRevealIndex(nextIndex);
        setShowWord(false);
        setRevealConfirm(false);
    };

    const handleRevealAction = () => {
        if (suppressNextClickRef.current) {
            suppressNextClickRef.current = false;
            return;
        }

        if (!showWord) {
            setShowWord(true);
            return;
        }

        if (revealIndex === playerList.length - 1) {
            if (!revealConfirm) {
                setRevealConfirm(true);
                return;
            }

            setPhase("results");
            return;
        }

        moveToNextReveal();
    };

    const handleRevealTouchStart = (event) => {
        if (!showWord) {
            return;
        }

        setTouchStartX(event.touches[0].clientX);
    };

    const handleRevealTouchEnd = (event) => {
        if (!showWord || touchStartX === null) {
            return;
        }

        const touchEndX = event.changedTouches[0].clientX;
        const swipeDistance = touchStartX - touchEndX;
        setTouchStartX(null);

        if (swipeDistance > 50) {
            suppressNextClickRef.current = true;
            if (revealIndex === playerList.length - 1) {
                setPhase("results");
                return;
            }
            setRevealConfirm(false);
            moveToNextReveal();
        }
    };

    return (
        <div className="app-shell">
            <div className="app-panel">
                <div className="app-topbar">
                    <div className="app-header">
                        <p className="eyebrow">Imposter ?</p>
                        <h1>Imposter Kali</h1>
                        <p className="lead"></p>
                    </div>
                    <button className="restart-button" type="button" onClick={restartGame}>
                        Restart
                    </button>
                </div>

                {phase === "setup" && (
                    <section className="stage-card">
                        <h2>Set up players</h2>
                        <p className="muted">Tap the players who are available to join the game, or add one manually.</p>

                        <div className="manual-player-row">
                            <input
                                className="input-field"
                                value={manualPlayerName}
                                onChange={(event) => setManualPlayerName(event.target.value)}
                                placeholder="Add player manually"
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        addManualPlayer();
                                    }
                                }}
                            />
                            <button className="secondary-button" type="button" onClick={addManualPlayer}>
                                Add Player
                            </button>
                        </div>

                        <div className="player-chip-grid">
                            {allPlayers.map((player) => {
                                const selected = availablePlayers.includes(player);

                                return (
                                    <button
                                        key={player}
                                        type="button"
                                        className={`player-chip ${selected ? "selected" : ""}`}
                                        onClick={() => togglePlayerAvailability(player)}
                                    >
                                        {player}
                                    </button>
                                );
                            })}
                        </div>

                        <p className="setup-note">Selected players: {availablePlayers.length}</p>
                        {error && <p className="error-text">{error}</p>}
                        <button className="primary-button" onClick={startGame}>
                            Start Game
                        </button>
                    </section>
                )}

                {phase === "reveal" && currentRevealPlayer && (
                    <section className="stage-card reveal-stage">
                        <div className="progress-row">
                            <span>
                                Player {revealIndex + 1} of {playerList.length}
                            </span>
                            <span>Pass to {currentRevealPlayer.name}</span>
                        </div>

                        <div
                            key={revealIndex}
                            className={`reveal-card ${showWord ? "revealed" : "hidden"} reveal-${revealDirection}`}
                            onTouchStart={handleRevealTouchStart}
                            onTouchEnd={handleRevealTouchEnd}
                            role="button"
                            tabIndex={0}
                        >
                            <p className="card-label">{currentRevealPlayer.name}</p>
                            {!showWord ? (
                                <>
                                    <h2>Tap to reveal the word</h2>
                                    <p className="muted">Tap once to show this player's word, then pass the screen to the next player.</p>
                                </>
                            ) : (
                                <>
                                    <h2>Your word is</h2>
                                    <div className="word-chip">{currentRevealPlayer.word}</div>
                                    <p className="muted">
                                        Memorize it, then pass the screen to the next player.
                                        {revealIndex === playerList.length - 1
                                            ? " Tap twice on the final button to reveal the imposter."
                                            : " Tap once to move to the next player."}
                                    </p>
                                    <p className="swipe-hint">Swipe left for the next player.</p>
                                </>
                            )}
                        </div>

                        <button className={`primary-button reveal-button ${revealConfirm ? "alert" : ""}`} onClick={handleRevealAction}>
                            {showWord
                                ? revealIndex === playerList.length - 1
                                    ? "Reveal Imposter"
                                    : "Hide & Next Player"
                                : revealConfirm
                                    ? "Tap Again to Reveal"
                                    : "Tap to Reveal"}
                        </button>
                    </section>
                )}

                {phase === "results" && game && (
                    <section className="stage-grid">
                        <div className="stage-card results-card">
                            <p className="eyebrow">Results</p>
                            <h2>Imposter Revealed</h2>
                            <p className="muted">The game ends here. Start a new round when you are ready.</p>
                            <div className="reveal-result-card">
                                <div className="reveal-result-name">{revealedImposter?.name || "Unknown"}</div>
                                <div className="reveal-result-role">Imposter</div>
                            </div>
                            <div className="result-grid">
                                <div className="result-box citizen-box">
                                    <span>Citizens word</span>
                                    <strong>{game.citizensWord}</strong>
                                </div>
                                <div className="result-box imposter-box">
                                    <span>Imposter word</span>
                                    <strong>{game.imposterWord}</strong>
                                </div>
                            </div>
                        </div>

                        <button className="primary-button full-width" onClick={restartGame}>
                            Play Again
                        </button>
                    </section>
                )}
            </div>
        </div>
    );
}

export default App;
