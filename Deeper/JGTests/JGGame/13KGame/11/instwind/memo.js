function playWindSound(){
        if(!audioCtx) return;
        
        const t = audioCtx.currentTime;
        const bufferSize = audioCtx.sampleRate * 3; // 3 seconds of audio
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate brown noise (filtered white noise for wind-like sound)
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            const brown = (lastOut + (0.01 * white)) / 1.03;
            data[i] = brown; //  *3 Amplify
            lastOut = brown;
        }
        
        const source = audioCtx.createBufferSource();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain(); // legacy (kept for compatibility / master)
        // NEW: stereo nodes
        const leftDelay = audioCtx.createDelay(0.01);   // up to 10ms (we will use < 1ms)
        const rightDelay = audioCtx.createDelay(0.01);
        const leftGain  = audioCtx.createGain();
        const rightGain = audioCtx.createGain();
        const merger    = audioCtx.createChannelMerger(2);
        const master    = audioCtx.createGain();
        
        source.buffer = buffer;
        source.loop = true;
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        filter.Q.value = 1.1;
        // Wiring (duplicate mono to two ears with independent delay/gain)
        source.connect(filter);
        filter.connect(leftDelay);
        filter.connect(rightDelay);
        leftDelay.connect(leftGain);
        rightDelay.connect(rightGain);
        leftGain.connect(merger, 0, 0);
        rightGain.connect(merger, 0, 1);
        merger.connect(master);
        master.connect(audioCtx.destination);
        // Fade-in
        master.gain.setValueAtTime(0, t);
        master.gain.linearRampToValueAtTime(0.2, t + 4);
        source.start();
        // expose nodes for updates
        audioCtx.windSource = source;
        audioCtx.windFilter = filter;
        audioCtx.windMaster = master;
        audioCtx.windLeftGain = leftGain;
        audioCtx.windRightGain = rightGain;
        audioCtx.windLeftDelay = leftDelay;
        audioCtx.windRightDelay = rightDelay;
    }

    // Reuse existing gust computation
    // --- Wind gust math (mirror of grass shader) ---
        // Compute gust/sway values using same vectors and time constants as the grass vertex shader
        function computeGustAt(x, z, timeSec) {
            // same direction vectors used in the grass vertex shader
            const w1x = 0.07, w1y = 0.05;
            const w2x = -0.03, w2y = 0.04;

            const dot1 = x * w1x + z * w1y;
            const dot2 = x * w2x + z * w2y;

            const g = 0.6 * Math.sin(dot1 + timeSec * 0.7) + 0.4 * Math.sin(dot2 - timeSec * 1.2);
            // small global phase term similar to per-blade phase in shader
            const sway = 0.25 * g + 0.07 * Math.sin(timeSec * 1.7 + 0.0);
            return { gust: g, sway: sway };
        }

    // NEW: approximate local wind vector from gust field gradient (finite difference)
    function computeWindVector(x, z, timeSec){
        const eps = 0.5;
        const gX1 = computeGustAt(x + eps, z, timeSec).gust;
        const gX0 = computeGustAt(x - eps, z, timeSec).gust;
        const gZ1 = computeGustAt(x, z + eps, timeSec).gust;
        const gZ0 = computeGustAt(x, z - eps, timeSec).gust;
        // gradient
        let gx = (gX1 - gX0) / (2*eps);
        let gz = (gZ1 - gZ0) / (2*eps);
        // Flow taken perpendicular to gradient (simulate flow along isobars)
        let vx = -gz;
        let vz =  gx;
        const len = Math.hypot(vx, vz) || 1;
        vx /= len; vz /= len;
        // Slowly rotate vector for variety
        const rot = 0.2 * Math.sin(timeSec * 0.05);
        const cr = Math.cos(rot), sr = Math.sin(rot);
        const rvx = vx*cr - vz*sr;
        const rvz = vx*sr + vz*cr;
        return {x:rvx, z:rvz, speed: len};
    }

    // Enhanced wind update with stereo spatialization
    function updateWind(timeSec, camX, camZ, yaw) {
        if (!audioCtx || !audioCtx.windMaster) return;
        const now = audioCtx.currentTime;
        const s = computeGustAt(camX, camZ, timeSec);
        const wind = computeWindVector(camX, camZ, timeSec);
        lastWindVec = wind;
        const baseGain = 0.08;
        const gainScale = 0.6;
        let targetGain = baseGain + gainScale * s.sway;
        targetGain = Math.max(0.01, Math.min(1.0, targetGain));
        audioCtx.windMaster.gain.setTargetAtTime(targetGain, now, 0.25);
        const baseFreq = 200;
        const norm = s.sway; // already 0..1 roughly
        const freq = baseFreq + norm * 1200;
        audioCtx.windFilter.frequency.setTargetAtTime(freq, now, 0.25);
        // Stereo: invert pan sign (audio opposite direction)
        const relAngle = Math.atan2(wind.x, wind.z) - yaw;
        const a = Math.atan2(Math.sin(relAngle), Math.cos(relAngle));
        const pan = -Math.sin(a);
        const ildAmt = 0.3;
        const leftLevel = 1 - ildAmt * pan;
        const rightLevel = 1 + ildAmt * pan;
        audioCtx.windLeftGain.gain.setTargetAtTime(leftLevel, now, 0.15);
        audioCtx.windRightGain.gain.setTargetAtTime(rightLevel, now, 0.15);
        const maxITD = 0.0007;
        const itd = maxITD * pan;
        const dL = itd > 0 ? itd : 0;
        const dR = itd < 0 ? -itd : 0;
        audioCtx.windLeftDelay.delayTime.setTargetAtTime(dL, now, 0.05);
        audioCtx.windRightDelay.delayTime.setTargetAtTime(dR, now, 0.05);
    }
    // -- /MODULE: Scene-Audio --