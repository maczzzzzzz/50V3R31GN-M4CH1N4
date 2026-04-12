import { useCallback, useRef } from 'react';
// Dial-up modem handshake tone — place the audio file at public/audio/dialup.mp3
const AUDIO_PATH = '/audio/dialup.mp3';
export function useFlushGate() {
    const audioRef = useRef(null);
    function getAudio() {
        if (!audioRef.current) {
            audioRef.current = new Audio(AUDIO_PATH);
            audioRef.current.loop = true;
        }
        return audioRef.current;
    }
    const onProposal = useCallback(() => {
        const audio = getAudio();
        audio.currentTime = 0;
        audio.play().catch(() => {
            // Autoplay blocked — requires prior user interaction
        });
    }, []);
    const onVerdict = useCallback(() => {
        const audio = getAudio();
        audio.pause();
        audio.currentTime = 0;
    }, []);
    return { onProposal, onVerdict };
}
