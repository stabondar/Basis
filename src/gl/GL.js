import { Scene, Vector2 } from 'three'
import Stats from 'stats-gl'

import Camera from './Camera.js'
import Renderer from './Renderer.js'
import EventEmitter from '@utils/EventEmitter.js'

import FluidSimulation from './fluid'

export default class GL extends EventEmitter
{
    constructor(canvas, app, main)
    {
        super()

        this.app = app
        this.main = main
        this.scroll = this.app.scroll.lenis
        this.sizes = this.app.sizes

        if(window.innerWidth < 991)
        {
            this.app.page.triggerLoad()
            if(!this.app.onceLoaded) this.app.globalLoader.tl.play()

            return
        }

        // Canvas
        this.canvas = canvas

        // Scene
        this.scene = new Scene()

        // Setup
        this.camera = new Camera(this.app, this, this.scene)
        this.renderer = new Renderer(this.app, this)

        this.loadWorld(this.main)

        if(this.app.debug.active)
        {
            this.stats = new Stats({ trackGPU: true })
            this.stats.init(this.renderer.instance)
            document.body.appendChild(this.stats.dom)

            this.stats.dom.style.left = '50%'
            this.stats.dom.style.translate = '-50%'
        }

        this.initWidth = window.innerWidth

        this.app.on('tick', () => this.update())
        this.app.on('resize', () => this.resize())
        this.app.on('destroy', () => this.destroy())

        this.fluid = new FluidSimulation(this.app, this)

        this.mouse = new Vector2()
        window.addEventListener('mousemove', (e) => this.onMouseMove(e))

        this.scroll.on('scroll', (e) => this.setScroll(e))
    }

    onMouseMove(e)
    {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = ((e.clientY / window.innerHeight) * -2 + 1)

        this.displacement?.onMouseMove(e, this.mouse)
        this.fluid?.getMouse(e, this.mouse)

        if(this.world && this.loaded) this.world.onMouseMove(e, this.mouse)
    }

    setScroll(e)
    {
        if(this.world && this.loaded) this.world.setScroll(e)
    }

    resize()
    {
        this.camera.resize()
        this.renderer.resize()

        this.fluid?.resize()

        if(this.world && this.loaded) setTimeout(() => this.world.resize(), 10)
    }

    update()
    {
        this.camera.update()
        this.displacement?.update()
        this.fluid?.update()

        if(this.world && this.loaded) this.world.update()

        this.renderer.update()

        if(this.stats) this.stats.update()
    }

    destroy()
    {
        if(this.world) this.world.destroy()
    }

    async loadWorld(main)
    {
        const page = main.getAttribute('data-transition-page')

        switch(page)
        {
            case 'home':
                await import('@gl/worlds/home/World.js').then(module => this.world = new module.default(this, this.app, this.scene, main))
                break

            case 'cases':
                await import('@gl/worlds/cases/World.js').then(module => this.world = new module.default(this, this.app, this.scene, main))
                break

            case 'services':
                await import('@gl/worlds/services/World.js').then(module => this.world = new module.default(this, this.app, this.scene, main))
                break

            default: await import('@gl/worlds/default/World.js').then(module => this.world = new module.default(this, this.app, this.scene, main))
        }
    }
}