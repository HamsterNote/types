1. 当前文件夹是用来给仓鼠笔记相关项目使用，定义了用来给不同的 DocumentParser 做互相转译（convert）使用 的 中间态的数据格式。
2. Intermediate 开头的 class，都要有 serialize 和 parse 函数，用来序列化和反序列化
3. 在名称定义上可以参考 pdfjs-dist 这个库，目前是以这个库为蓝本写出的第一版代码
