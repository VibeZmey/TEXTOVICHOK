// src/data/mockData.js

// ← ЕДИНЫЙ массив всех пользователей (источник истины)
export const mockUsers = [
    {
        id: "7f4d8d51-9cc0-4f52-8d8f-2a3f1d2b7e41", // ← Один и тот же ID везде!
        login: "username",
        password: "password",
        email: "username@email.com",
        role: "User",
        status: "active",
        description: "Music lover. Writing annotations.",
        annotations: [

        ],
        albums: [
            {
                id: "album-1",
                name: "After Hours",
                artist: "The Weeknd",
                coverImage: "",
                songs: [
                    { id: "song-1", name: "Blinding Lights", year: 2020, text: "I walk this road alone tonight...\nMore lyrics here..." },
                ],
                status: "pending",

            },
        ],
    },
    {
        id: "2",
        login: "editor1",
        email: "editor1@email.com",
        role: "Editor",
        status: "active",
        annotations: [],
        albums: [],
    },
];

export const CURRENT_USER_ID = "7f4d8d51-9cc0-4f52-8d8f-2a3f1d2b7e41";

export const getCurrentUser = () =>
    mockUsers.find(u => u.id === CURRENT_USER_ID);

