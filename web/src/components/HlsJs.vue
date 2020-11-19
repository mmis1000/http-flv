<template>
  <div id="flv-js-player">
    <el-form :model="mediaDataSource" :disabled="!supported" @submit.native.prevent>
      <el-form-item>
        <el-input v-model="mediaDataSource.url" />
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="mediaDataSource.isLive" label="isLive" />
      </el-form-item>
      <el-form-item>
        <el-button size="mini" type="primary" @click="load">LOAD</el-button>
        <el-button size="mini" @click="start">START</el-button>
        <el-button size="mini" @click="pause">PAUSE</el-button>
        <el-button size="mini" type="danger" @click="destroy">DESTROY</el-button>
      </el-form-item>
      <el-form-item>
        Current buffer length: {{poorestHealth.toFixed(3)}}s
      </el-form-item>
    </el-form>
    <video v-bind="mappedMediaDataSource.isLive ? {} : { controls: '' }" @timeupdate="onTimeUpdate" ref="video">
    </video>
  </div>
</template>

<script>
/* eslint-disable no-console */
import Hls from 'hls.js'

// const PLAY_TIMEOUT = 10 * 1000

// const isSafari = /^((?!chrome|android).)*safari|^((?!chrome|android).)*(iPhone|iPad);/i.test(navigator.userAgent)

export default {
  name: 'hls-js',
  watch: {
    'mediaDataSource.url': (value) => {
      try {
        localStorage.setItem('hls-js.mediaDataSource.url', value)
      } catch (error) {
        // eslint-disable-next-line
        console.log(error)
      }
    }
  },
  methods: {
    loadLocalMediaDataSource() {
      try {
        let url = localStorage.getItem('hls-js.mediaDataSource.url')
        if (url !== null) this.mediaDataSource.url = url
      } catch (error) {
        // eslint-disable-next-line
        console.log(error)
      }
    },
    load() {
      this.bufferHealth = []
      this.playbackRate = 1

      this.hls && this.destroy()
      this.hls = new Hls(this.mediaDataSource.config)
      this.hls.loadSource(this.mediaDataSource.url);
      this.hls.attachMedia(this.$refs.video);
      this.player = this.$refs.video

      this.bindEvents()
      // this.start()
    },
    bindEvents() {
      // this.player.on('error', this.destroy)
      // this.player.on('loading_complete', this.destroy)
      // this.player.on('recovered_early_eof', this.destroy)
      // this.player.on('media_info', this.destroy)
      // this.player.on('metadata_arrived', this.destroy)
      // this.player.on('statistics_info', () => { })

      this.hls.on(Hls.Events.MANIFEST_PARSED, (ev) => {
        console.log(ev)
      })
    },
    start() {
      console.log(this.player)
      this.player && this.player.play();
    },
    pause() {
      console.log(this.player)
      this.player && this.player.pause();
    },
    destroy() {
      if (this.hls) {
        this.player.pause();
        this.hls.detachMedia()
        this.hls.destroy()
        this.hls = null;
      }
    },

    // latency control
    onTimeUpdate () {
      if (!this.mappedMediaDataSource.isLive) {
        return
      }

      /**
       * @type { HTMLVideoElement }
       */
      const video = this.$refs.video

      if (!video || video.paused || !video.buffered || video.buffered.length === 0) {
        return
      }

      const currentPosition = video.currentTime
      const currentEnd = video.buffered.end(video.buffered.length - 1)
      const currentBufferHealth = currentEnd - currentPosition

      // update data
      const periodId = Math.floor(Date.now() / 500)

      let record
      if (!this.bufferHealth.length || this.bufferHealth[this.bufferHealth.length - 1].periodId !== periodId) {
        record = {
          periodId,
          min: currentBufferHealth
        }

        this.bufferHealth.push(record)
      } else {
        record = this.bufferHealth[this.bufferHealth.length - 1]
      }

      record.min = Math.min(record.min, currentBufferHealth)

      if (this.bufferHealth.length > this.bufferHealthRecordSize) {
        this.bufferHealth.shift()
      }
      if (this.bufferHealth.length < this.bufferHealthRecordSize) {
        return // we don't have enough data to judge yet
      }

      if (this.poorestHealth > this.bufferHealthHighWaterMark * 2) {
        // do a leap, we are too far behind
        video.currentTime = video.currentTime + (this.poorestHealth - this.bufferHealthTarget)
      } else if (this.poorestHealth > this.bufferHealthHighWaterMark) {
        if (this.playbackRate === 1) {
          this.playbackRate = video.playbackRate = 1.05
        }
      } else if (this.poorestHealth < this.bufferHealthTarget) {
        if (this.playbackRate > 1) {
          this.playbackRate = video.playbackRate = 1
        }
      }
    },
  },
  data() {
    let host = location.protocol + '//' + location.hostname + ':' + location.port;

    return {
      supported: false,
      hls: null,
      player: null,

      mediaDataSource: {
        config: { liveSyncDurationCount: 1 },
        isLive: true,
        url: host + '/live?app=demo&stream=stream-1'
      },

      // latency tracking for live video
      bufferHealthRecordSize: 10,
      bufferHealth: [
        // { periodId: Math.floor(second / 500), min: second }
      ],
      bufferHealthHighWaterMark: 1.5,
      bufferHealthTarget: 0.7,
      playbackRate: 1
    }
  },
  computed: {
    mappedMediaDataSource () {
      return {
        ...this.mediaDataSource
      }
    },
    poorestHealth () {
      return Math.min(...this.bufferHealth.map(i => i.min))
    }
  },
  mounted() {
    this.supported = Hls.isSupported()

    this.loadLocalMediaDataSource()
  },
  beforeDestroy() {
    this.destroy()
  }
}
</script>

<style lang="scss">
#flv-js-player {
  > video {
    width: 100%;
  }
}
</style>
