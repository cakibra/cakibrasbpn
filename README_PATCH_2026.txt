CAKIBRA patch pack

Что сделано:
- тёмная тема переработана
- левое меню с большим логотипом и сворачиванием
- отдельная вкладка "Маршрутизатор"
- тумблеры для YouTube, ChatGPT/OpenAI, Instagram, Facebook, X/Twitter, Discord, Signal, Wikipedia, Speedtest
- split routing через route rules в sing-box
- улучшена сборка VLESS/TLS/Reality/SNI/ALPN/WS/gRPC
- power-кнопка на тёмной теме переработана
- cmd-окно для sing-box скрывается через CREATE_NO_WINDOW
- screenshots/* содержит превью экранов

Что проверено в контейнере:
- TypeScript check: OK
- Vite production build: OK

Что НЕ удалось проверить в этом окружении:
- реальный Windows Tauri runtime
- живое подключение к вашему конкретному VLESS-серверу
- TUN режим (оставлен как beta-переключатель)
