// src/utils/TvControlService.ts

export const TvControlService = {
    sendCommand: (ipAddress: string, action: 'open' | 'start_paket' | 'close', durationMinutes?: number): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            if (!ipAddress) {
                console.log("IP Address TV tidak ditemukan, skip command.");
                return resolve(false);
            }

            // Port 8080 sesuai dengan backend Node.js di TV sebelumnya
            const wsUrl = `ws://${ipAddress}:8080`;
            const ws = new WebSocket(wsUrl);

            // Timeout jika TV mati / tidak terhubung ke WiFi
            const connectionTimeout = setTimeout(() => {
                ws.close();
                reject(new Error("Timeout: TV tidak merespon"));
            }, 3000);

            ws.onopen = () => {
                clearTimeout(connectionTimeout);
                const payload = {
                    action: action,
                    duration: durationMinutes
                };
                ws.send(JSON.stringify(payload));
                console.log(`Command '${action}' sent to TV ${ipAddress}`);

                // Tutup koneksi setelah mengirim untuk hemat memori
                setTimeout(() => ws.close(), 500);
                resolve(true);
            };

            ws.onerror = (e) => {
                clearTimeout(connectionTimeout);
                // Use type assertion to access message if it exists, or provide a fallback
                const errorMessage = (e as any).message || "Koneksi ke TV gagal atau terputus";
                console.error(`Gagal konek ke TV ${ipAddress}:`, errorMessage);
                reject(new Error(errorMessage));
            };
        });
    }
};