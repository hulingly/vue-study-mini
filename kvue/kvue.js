class KVue {
    constructor(options) {
        // 保存选项
        this.$options = options;
        // 传入data
        this.$data = options.data;

        // 响应处理
        this.observe(this.$data);

        // new Watcher(this, "foo");
        // console.log(this.foo);
        // new Watcher(this, "bar.mua");
        // console.log(this.bar.mua);
        new compile(options.el, this);

        options.created && options.created.call(this);
    }
    observe(value) {
        if (!value || typeof value !== "object") {
            return;
        }

        Object.keys(value).forEach(key => {
            this.defineReactive(value, key, value[key]);
            this.proxyData(key);
        });
    }
    defineReactive(obj, key, val) {
        // 递归遍历val
        this.observe(val);

        // 每个dep和KVue实例中的data中每个key有一对一的关系
        const dep = new Dep();

        // 给obj的每一个key定义拦截
        Object.defineProperty(obj, key, {
            get() {
                // 依赖收集
                Dep.target && dep.addDep(Dep.target);
                // console.log(key + "属性被访问了");
                return val;
            },
            set(newVal) {
                if (val !== newVal) {
                    val = newVal;
                    dep.notify();
                }
                // console.log(key + "属性被修改了");
            }
        });
    }
    // 在vue根上定义属性代理data中的数据
    proxyData(key) {
        // this指的KVue实例
        Object.defineProperty(this, key, {
            get() {
                return this.$data[key];
            },
            set(newVal) {
                this.$data[key] = newVal;
            }
        });
    }
}

// 创建Dep, 管理页面中的所有的watcher
class Dep {
    constructor() {
        this.deps = [];
    }

    addDep(dep) {
        this.deps.push(dep);
    }

    notify() {
        this.deps.forEach(dep => {
            dep.update();
        });
    }
}

// 创建watcher,  保存data中的数值和页面中的关系
class Watcher {
    // 创建实例时立刻将dep的target指向此watcher的实例,便于依赖的手机
    constructor(vm, key, cb) {
        this.vm = vm;
        this.key = key;
        this.cb = cb;

        // 依赖收集
        Dep.target = this;
        this.vm[this.key]; // 在这里读取一次  出发依赖收集
        Dep.target = null;
    }
    update() {
        this.cb.call(this.vm, this.vm[this.key]);
        // console.log(this.key + "更新啦!");
    }
}
