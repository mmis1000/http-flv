<template>
  <canvas ref="canvas" height="100" width="360"></canvas>
</template>

<script>
export default {
  data () {
    return {
      canvas: null,
      ctx: null,
      secondCanvas: null,
      secondCtx: null,
    }
  },
  methods: {
    updateCanvas (length, average) {
      const max = 4

      length = Math.max(0, Math.min(max, length))

      /**
       * @type {HTMLCanvasElement}
       */
      const canvas = this.canvas
      /**
       * @type {CanvasRenderingContext2D}
       */
      const ctx = this.ctx
      /**
       * @type {HTMLCanvasElement}
       */
      const secondCanvas = this.secondCanvas
      /**
       * @type {CanvasRenderingContext2D}
       */
      const ctx2 = this.secondCtx

      ctx2.clearRect(0, 0, secondCanvas.width, secondCanvas.height)
      ctx2.drawImage(canvas, -2, 0)
      const color = `hsl(${~~(360 / max * length)}deg, 50%, 50%)`
      ctx2.fillStyle = color
      ctx2.fillRect(secondCanvas.width - 2, secondCanvas.height * (max - length) / max, 2, secondCanvas.height *  length / max)
  
      ctx2.fillStyle = 'red'
      ctx2.fillRect(0, (max - 1) / max * secondCanvas.height, secondCanvas.width, 1)
      ctx2.fillStyle = 'red'
      ctx2.fillRect(0, (max - 2) / max * secondCanvas.height, secondCanvas.width, 1)
      ctx2.fillStyle = 'red'
      ctx2.fillRect(0, (max - 3) / max * secondCanvas.height, secondCanvas.width, 1)

      // average
      ctx2.fillStyle = 'black'
      ctx2.fillRect(secondCanvas.width - 2, secondCanvas.height * (max - average) / max, 2, 2)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(secondCanvas, 0, 0)
    }
  },
  mounted () {
    this.canvas = this.$refs.canvas
    this.ctx = this.canvas.getContext('2d')

    this.secondCanvas = document.createElement('canvas')
    this.secondCanvas.width= this.$refs.canvas.width
    this.secondCanvas.height = this.$refs.canvas.height

    this.secondCtx = this.secondCanvas.getContext('2d')
  }
}
</script>

<style>

</style>