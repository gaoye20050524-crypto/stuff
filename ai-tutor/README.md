# AI小助手 - 智慧课堂管理问答机器人

基于 Flask + DeepSeek API 的小学AI知识问答应用。

## 功能
- 教师/学生双角色
- AI知识问答（30条本地知识库）
- 儿童友好的聊天界面

## 运行
```bash
pip install -r requirements.txt
python app.py
```

访问 http://127.0.0.1:5000

## 项目结构
```
ai-tutor/
├── 1_教案/          # 教案文档
├── 2_PPT/           # 授课PPT  
├── 3_教具/          # 教具代码+报告
│   ├── app.py       # Flask后端
│   ├── knowledge/   # 知识库
│   ├── static/      # CSS/JS
│   └── templates/   # HTML模板
├── app.py           # 主程序
└── requirements.txt # 依赖
```