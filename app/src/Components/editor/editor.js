import axios from 'axios'
import React, {Component} from 'react'
import '../../helpers/iframeLoader.js'

export default class Editor extends Component {
    constructor() {
        super(undefined)

        this.currentPage = 'index.html'

        this.state = {
            pageList: [],
            newPageName: ''
        }
        this.createNewPage = this.createNewPage.bind(this)
    }

    init(page) {
        this.iframe = document.querySelector('iframe')
        this.open(page)
        this.loadPageList()
    }

    parseStringToDOM(str) {
        const parser = new DOMParser()
        return parser.parseFromString(str, "text/html")
    }

    open(page) {
        this.currentPage = `../${page}?rnd=${Math.random()}`

        axios
            .get(`../${page}`)
            .then(res => this.parseStringToDOM(res.data))
            .then(this.wrapTextNodes)
            .then(dom => {
                this.virtualDom = dom
                return dom
            })
            .then(this.serializeDomToString)
            .then(html => axios.post('./api/saveTempPage.php', {html}))
            .then(() => this.iframe.load('../temp.html'))
            .then(() => this.enableEditing())
    }

    enableEditing() {
        this.iframe.contentDocument.body
            .querySelectorAll('text-editor')
            .forEach(element => {
                element.contentEditable = 'true'
                element.addEventListener('input', () => {
                    this.onTextEdit(element)
                })
            })
    }

    onTextEdit(element) {
        const id = element.getAttribute('nodeid')
        this.virtualDom.body.querySelector(`[nodeid="${id}"]`).innerHTML =element.innerHTML
    }

    wrapTextNodes(dom) {
        const body = dom.body
        let textNodes = []

        function recursy(element) {
            element.childNodes.forEach(node => {

                if (node.nodeName === '#text' && node.nodeValue.replace(/\s+/g, '').length > 0) {
                    textNodes.push(node)
                } else {
                    recursy(node)
                }
            })
        }

        recursy(body)

        textNodes.forEach((node, i) => {
            const wrapper = dom.createElement('text-editor')
            node.parentNode.replaceChild(wrapper, node)
            wrapper.appendChild(node)
            wrapper.setAttribute('nodeid', i)
        })

        return dom
    }

    serializeDomToString(dom) {
        const serializer = new XMLSerializer()
        return serializer.serializeToString(dom)

    }

    loadPageList() {
        axios
            .get('./api')
            .then(res => this.setState({pageList: res.data}))
    }

    componentDidMount() {
        this.init(this.currentPage)
    }

    createNewPage() {
        axios
            .post('./api/createNewPage.php', {'name': this.state.newPageName})
            .then(this.loadPageList())
            .catch(() => alert('Страница существует'))
    }

    deletePage(page) {
        axios
            .post('./api/deletePage.php', {'name': page})
            .then(this.loadPageList())
            .catch(() => alert('Страницы не существует'))
    }

    render() {
        // const {pageList} = this.state
        // const pages = pageList.map((page, i) => {
        //     return (
        //         <h1 key={i}>{page}
        //             <a onClick={() => this.deletePage(page)} href="#">(x)</a>
        //         </h1>
        //     )
        // })

        return (
            <iframe src={this.currentPage} frameBorder="0"/>
            // <>
            //     <input onChange={(e) => {
            //         this.setState({newPageName: e.target.value})
            //     }} type="text"/>
            //
            //     <button onClick={this.createNewPage}>Создать страницу</button>
            //     {pages}
            // </>
        )
    }
}
