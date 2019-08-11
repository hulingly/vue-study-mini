class compile {
    constructor(el, vm) {
        this.$vm = vm;
        this.$el = document.querySelector(el);
        // 创建一个html代码片段
        this.$fragment = this.node2Fragment(this.$el);
        // 执行编译
        this.compile(this.$fragment);
        // 将编译完成的代码片段替换el中的内容
        this.$el.appendChild(this.$fragment);
    }
    node2Fragment(el) {
        let fragment = document.createDocumentFragment();
        let child;
        while ((child = el.firstChild)) {
            fragment.appendChild(child);
        }
        return fragment;
    }
    compile(el) {
        const childNodes = el.childNodes;
        Array.from(childNodes).forEach(node => {
            if (node.nodeType == 1) {
                // 元素节点
                // console.log("编译元素" + node.nodeName);
                //编译元素节点
                this.compileElement(node);
            } else if (this.isInter(node)) {
                // 文本节点且符合{{xxx}}结构的
                // console.log("编译插值文本" + node.textContent);
                // 编译文本节点
                this.compileText(node);
            }
            if (node.children && node.childNodes.length > 0) {
                // 递归遍历node的子节点
                this.compile(node);
            }
        });
    }
    isInter(node) {
        // 符合{{xxx}}结构的文本节点
        return node.nodeType == 3 && /\{\{(.*)\}\}/.test(node.textContent);
    }
    compileText(node) {
        // 编译文本节点
        const exp = RegExp.$1;
        this.update(node, exp, "text");
    }
    update(node, exp, dir) {
        // 初次更新节点
        const updator = this[dir + "Updator"];
        updator && updator(node, this.$vm[exp]);

        // 创建Watcher实例，依赖收集完成了
        new Watcher(this.$vm, exp, function(value) {
            // 依赖更新事触发此回调, 进行dom的更新
            updator && updator(node, value);
        });
    }
    textUpdator(node, value) {
        // 更新文本节点
        node.textContent = value;
    }
    htmlUpdator(node, value) {
        // 更新k-html指令节点dom
        node.innerHTML = value;
    }
    modelUpdator(node, value) {
        // 更新文本节点
        node.value = value;
    }
    compileElement(node) {
        const attrs = node.attributes;
        Array.from(attrs).forEach(attr => {
            const attrName = attr.name;
            const exp = attr.value;
            if (attrName.indexOf("k-") == 0) {
                const dir = attrName.substring(2);
                this["K" + dir] && this["K" + dir](node, exp);
            } else if (attrName.indexOf("@") == 0) {
                const event = attrName.substring(1);
                this["at" + event] && this["at" + event](node, event, exp);
            }
        });
    }
    // k-text指令
    Ktext(node, exp) {
        this.update(node, exp, "text");
    }
    // k-html指令
    Khtml(node, exp) {
        this.update(node, exp, "html");
    }
    // k-model指令
    Kmodel(node, exp) {
        const _this = this;
        this.update(node, exp, "model");
        // 给k-model节点添加input事件
        node.addEventListener("input", function(e) {
            _this.$vm[exp] = e.target.value;
        });
    }
    // @click
    atclick(node, event, exp) {
        const methods = this.$vm.$options.methods;
        methods &&
            methods[exp] &&
            event &&
            node.addEventListener(event, methods[exp].bind(this.$vm));
    }
}
