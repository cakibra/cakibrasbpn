# SELF_CHECK

Дата проверки: 2026-04-17

## Что было проверено
- Структура проекта и согласованность путей Tauri / React / Vite.
- TypeScript-типизация фронтенда через `npm run lint:check`.
- Production-сборка фронтенда через `npm run build`.
- Согласованность bridge-команд между React и Tauri invoke-командами.
- Согласованность сериализации camelCase между фронтендом и Rust-моделями.
- Наличие и корректность `build.bat`, `tauri.conf.json`, capability-конфига, sidecar download script.
- Наличие runtime-ресурсов проекта: иконки, папка для sidecar, README, инструкции.

## Что было исправлено в ходе самопроверки
- Исправлен порядок объявления `applyGeoForProfiles` / `refreshSubscription` во фронтенде.
- Исправлен тип аргумента callback в `useRuntimePoll`.
- Исправлена сериализация `ConnectionProfile` в Rust (`camelCase` для полей вроде `subscriptionId` и `sourceLabel`).
- Уточнён вывод путей в `build.bat`, чтобы не зависеть от конкретного имени exe-файла.

## Ограничение среды проверки
В текущем контейнере отсутствуют `rustc` и `cargo`, поэтому полноценная локальная сборка Tauri/Rust здесь не могла быть выполнена.
Из-за этого Rust-часть прошла статическую архитектурную проверку и проверку согласованности API, но не фактическую компиляцию в этой среде.

## Результат
- Фронтенд: проверен и собран успешно.
- Rust/Tauri: подготовлен к сборке на Windows с установленными Rust toolchain, Microsoft C++ Build Tools и WebView2 Runtime.
