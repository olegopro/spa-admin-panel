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

    open(page) {
        this.currentPage = `../${page}`
        this.iframe.load(this.currentPage, () => {
            const body = this.iframe.contentDocument.body
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
            textNodes.forEach(node => {
                const wrapper = this.iframe.contentDocument.createElement('text-editor')
                node.parentNode.replaceChild(wrapper, node)
                wrapper.appendChild(node)
                wrapper.contentEditable = 'true'
            })


        })

    }

    componentDidMount() {
        this.init(this.currentPage)
    }

    loadPageList() {
        axios
            .get('./api')
            .then(res => this.setState({pageList: res.data}))
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
