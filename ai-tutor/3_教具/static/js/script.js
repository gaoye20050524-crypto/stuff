document.addEventListener('DOMContentLoaded', function() {
    const messagesContainer = document.getElementById('messages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const quickBtns = document.querySelectorAll('.quick-btn');

    let isLoading = false;

    function addMessage(content, role) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        if (role === 'user') {
            avatar.textContent = '你';
        } else {
            avatar.textContent = '🤖';
        }

        const bubble = document.createElement('div');
        bubble.className = 'bubble';

        if (role === 'ai') {
            bubble.innerHTML = '';
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(bubble);
            messagesContainer.appendChild(messageDiv);
            typeWriter(bubble, content);
        } else {
            bubble.textContent = content;
            messageDiv.appendChild(bubble);
            messageDiv.appendChild(avatar);
            messagesContainer.appendChild(messageDiv);
            scrollToBottom();
        }
    }

    function typeWriter(element, text, speed = 30) {
        let index = 0;
        element.innerHTML = '';
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        element.appendChild(cursor);

        function addChar() {
            if (index < text.length) {
                cursor.before(document.createTextNode(text[index]));
                index++;
                scrollToBottom();
                setTimeout(addChar, speed);
            } else {
                cursor.remove();
                scrollToBottom();
            }
        }
        addChar();
    }

    function addErrorMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai';

        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = '🤖';

        const bubble = document.createElement('div');
        bubble.className = 'bubble error';
        bubble.textContent = content;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.id = 'loadingIndicator';
        loadingDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        messagesContainer.appendChild(loadingDiv);
        scrollToBottom();
    }

    function hideLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            loading.remove();
        }
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function setLoading(state) {
        isLoading = state;
        sendBtn.disabled = state;
        userInput.disabled = state;
        if (state) {
            userInput.setAttribute('placeholder', 'AI正在思考中...');
        } else {
            userInput.setAttribute('placeholder', '输入你想问的问题...');
            userInput.focus();
        }
    }

    async function sendMessage(text) {
        if (!text || !text.trim() || isLoading) return;

        const message = text.trim();
        userInput.value = '';
        addMessage(message, 'user');
        setLoading(true);
        showLoading();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });

            hideLoading();

            if (!response.ok) {
                throw new Error('网络请求失败');
            }

            const data = await response.json();

            if (data.error) {
                addErrorMessage('哎呀，出了点小问题：' + data.error);
            } else {
                addMessage(data.reply, 'ai');
            }
        } catch (error) {
            hideLoading();
            addErrorMessage('网络开小差了，请稍后再试吧！');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    sendBtn.addEventListener('click', function() {
        sendMessage(userInput.value);
    });

    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage(userInput.value);
        }
    });

    quickBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const text = btn.getAttribute('data-question');
            if (text) {
                sendMessage(text);
            }
        });
    });
});
