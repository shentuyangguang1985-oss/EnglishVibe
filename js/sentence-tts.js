/**
 * 播放由同源服务合成的例句音频。
 */
const SentenceTTS = {
  endpoint: new URL('../api/tts', document.currentScript.src),
  playback: null,

  async speak(sentence, { onEnd, onError } = {}) {
    this.stop();
    const controller = new AbortController();
    const playback = { controller, audio: null, url: null };
    this.playback = playback;
    const timeout = setTimeout(() => controller.abort(), 15000);

    const fail = () => {
      if (this.playback !== playback) return;
      this.stop();
      onError?.();
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        redirect: 'error',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence }),
        signal: controller.signal
      });
      if (!response.ok || !response.headers.get('Content-Type')?.startsWith('audio/')) {
        throw new Error('例句音频不可用');
      }
      const blob = await response.blob();
      if (this.playback !== playback) return;
      if (!blob.size) throw new Error('例句音频为空');

      playback.url = URL.createObjectURL(blob);
      playback.audio = new window.Audio(playback.url);
      playback.audio.onended = () => {
        if (this.playback !== playback) return;
        this.stop();
        onEnd?.();
      };
      playback.audio.onerror = fail;
      await playback.audio.play();
    } catch {
      fail();
    } finally {
      clearTimeout(timeout);
    }
  },

  stop() {
    const playback = this.playback;
    if (!playback) return;
    this.playback = null;
    playback.controller.abort();
    if (playback.audio) {
      playback.audio.onended = null;
      playback.audio.onerror = null;
      playback.audio.pause();
    }
    if (playback.url) URL.revokeObjectURL(playback.url);
  }
};
