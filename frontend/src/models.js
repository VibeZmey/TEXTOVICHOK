// src/types/models.js

/**
 * @typedef {Object} User
 * @property {string} id - UUID пользователя
 * @property {string} login - Логин пользователя
 * @property {string} [email] - Email (опционально)
 * @property {string} [description] - Описание профиля
 * @property {string} [imageUrl] - Путь к аватару (относительно CDN)
 * @property {boolean} isEditor - Флаг редактора
 * @property {boolean} isArtist - Флаг артиста
 * @property {boolean} isBlocked - Флаг блокировки
 * @property {string} createdAt - Дата создания (ISO 8601)
 * @property {string} [updatedAt] - Дата обновления (ISO 8601)
 */

/**
 * @typedef {Object} Album
 * @property {string} id - UUID альбома
 * @property {string} name - Название альбома
 * @property {string} [description] - Описание альбома
 * @property {string} userId - UUID владельца альбома
 * @property {string} [imageUrl] - Путь к обложке (относительно CDN)
 * @property {number} year - Год выпуска
 * @property {string} createdAt - Дата создания (ISO 8601)
 * @property {string} [updatedAt] - Дата обновления (ISO 8601)
 */

/**
 * @typedef {Object} Lyrics
 * @property {string} id - UUID текста песни
 * @property {string} name - Название песни
 * @property {string} albumId - UUID альбома
 * @property {number} orderIndex - Порядковый номер в альбоме
 * @property {string} [text] - Текст песни
 * @property {string} [description] - Описание песни
 * @property {number} [duration] - Длительность в секундах
 * @property {number} [views] - Количество просмотров
 * @property {string} createdAt - Дата создания (ISO 8601)
 * @property {string} [updatedAt] - Дата обновления (ISO 8601)
 */

/**
 * @typedef {Object} Annotation
 * @property {string} id - UUID аннотации
 * @property {string} lyricsId - UUID текста песни
 * @property {string} userId - UUID автора аннотации
 * @property {number} from - Начальная позиция в тексте
 * @property {number} to - Конечная позиция в тексте
 * @property {string} [text] - Текст аннотации
 * @property {boolean} isVerified - Подтверждена ли аннотация
 * @property {boolean} isRejected - Отклонена ли аннотация
 * @property {string} createdAt - Дата создания (ISO 8601)
 * @property {string} [updatedAt] - Дата обновления (ISO 8601)
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} accessToken - JWT токен доступа
 * @property {string} refreshToken - JWT токен обновления
 * @property {number} expiresIn - Время жизни токена в секундах
 */

/**
 * @typedef {Object} ApiError
 * @property {string} message - Сообщение об ошибке
 * @property {string} [code] - Код ошибки
 * @property {number} [status] - HTTP статус
 */