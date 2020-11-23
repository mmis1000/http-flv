<template>
  <div id="flv-js-player">
    <el-form :model="mediaDataSource" :disabled="!supported" @submit.native.prevent>
      <el-form-item>
        <el-input v-model="mediaDataSource.url" />
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="mediaDataSource.isLive" label="isLive" />
        <el-checkbox v-model="mediaDataSource.hasAudio" label="hasAudio" />
        <el-checkbox v-model="mediaDataSource.hasVideo" label="hasVideo" />
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
    <stat ref="stat" />
  </div>
</template>

<script>
import Flv from 'flv.js'

import Stat from './Stat'

export default {
  name: 'flv-js',
  components: {
    Stat
  },
  watch: {
    'mediaDataSource.url': (value) => {
      try {
        localStorage.setItem('flv-js.mediaDataSource.url', value)
      } catch (error) {
        // eslint-disable-next-line
        console.log(error)
      }
    }
  },
  methods: {
    loadLocalMediaDataSource() {
      try {
        let url = localStorage.getItem('flv-js.mediaDataSource.url')
        if (url !== null) this.mediaDataSource.url = url
      } catch (error) {
        // eslint-disable-next-line
        console.log(error)
      }
    },
    load() {
      this.bufferHealth = []
      this.playbackRate = 1

      this.player && this.destroy()
      this.player = Flv.createPlayer({ ...this.mappedMediaDataSource })

      this.player.attachMediaElement(this.$refs.video);
      this.player.load()

      this.bindEvents()
      // this.start()
    },
    bindEvents() {
      this.player.on('error', this.destroy)
      // this.player.on('loading_complete', this.destroy)
      // this.player.on('recovered_early_eof', this.destroy)
      // this.player.on('media_info', this.destroy)
      // this.player.on('metadata_arrived', this.destroy)
      this.player.on('statistics_info', () => { })
    },
    start() {
      this.player && this.player.play();
    },
    pause() {
      this.player && this.player.pause();
    },
    destroy() {
      if (this.player) {
        this.player.pause();
        this.player.unload();
        this.player.detachMediaElement();
        this.player.destroy();
        this.player = null;
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

      this.$refs.stat.updateCanvas(currentBufferHealth, this.poorestHealth)

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
      player: null,

      mediaDataSource: {
        type: 'flv',
        isLive: true,
        url: host + '/live?app=demo&stream=stream-1',
        hasAudio: true,
        hasVideo: true,
      },

      // latency tracking for live video
      bufferHealthRecordSize: 10,
      bufferHealth: [
        // { periodId: Math.floor(second / 500), min: second }
      ],
      bufferHealthHighWaterMark: 1.6,
      bufferHealthTarget: 0.8,
      playbackRate: 1
    }
  },
  computed: {
    mappedMediaDataSource () {
      return {
        ...this.mediaDataSource,
        ...(this.mediaDataSource.isLive ? {
          enableStashBuffer: false,
          stashInitialSize: 128,
          enableWorker: true
        } : {})
      }
    },
    poorestHealth () {
      return Math.min(...this.bufferHealth.map(i => i.min))
    }
  },
  mounted() {
    this.supported = Flv.isSupported()

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
