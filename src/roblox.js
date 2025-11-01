const axios = require('axios');

class RobloxAPI {
  constructor() {
    this.baseURL = 'https://api.roblox.com';
    this.groupsURL = 'https://groups.roblox.com';
    this.usersURL = 'https://users.roblox.com';
    this.gamesURL = 'https://games.roblox.com';
  }

  // Kullanıcı adından Roblox ID'sini al
  async getUserIdByUsername(username) {
    try {
      const response = await axios.post(`${this.usersURL}/v1/usernames/users`, {
        usernames: [username],
        excludeBannedUsers: false
      });
      
      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0].id;
      }
      return null;
    } catch (error) {
      console.error('Kullanıcı ID alınırken hata:', error.message);
      return null;
    }
  }

  // Kullanıcının grup rütbesini al
  async getUserRankInGroup(userId, groupId) {
    try {
      const response = await axios.get(`${this.groupsURL}/v1/users/${userId}/groups/roles`);
      const group = response.data.data.find(g => g.group.id === parseInt(groupId));
      
      if (group) {
        return {
          rank: group.role.rank,
          name: group.role.name,
          id: group.role.id
        };
      }
      return null;
    } catch (error) {
      console.error('Grup rütbesi alınırken hata:', error.message);
      return null;
    }
  }

  // Kullanıcının tüm gruplarını al
  async getUserGroups(userId) {
    try {
      const response = await axios.get(`${this.groupsURL}/v1/users/${userId}/groups/roles`);
      
      if (response.data.data && response.data.data.length > 0) {
        return response.data.data.map(g => ({
          groupId: g.group.id,
          groupName: g.group.name,
          rank: g.role.rank,
          roleName: g.role.name
        }));
      }
      return [];
    } catch (error) {
      console.error('Kullanıcı grupları alınırken hata:', error.message);
      return null;
    }
  }

  // Gruptaki tüm rütbeleri al
  async getGroupRoles(groupId) {
    try {
      const response = await axios.get(`${this.groupsURL}/v1/groups/${groupId}/roles`);
      return response.data.roles;
    } catch (error) {
      console.error('Grup rütbeleri alınırken hata:', error.message);
      return null;
    }
  }

  // Kullanıcının rütbesini değiştir (ROBLOX_COOKIE gerekli)
  async setUserRole(userId, groupId, roleId, cookie) {
    try {
      const response = await axios.patch(
        `${this.groupsURL}/v1/groups/${groupId}/users/${userId}`,
        { roleId: roleId },
        {
          headers: {
            'Cookie': `.ROBLOSECURITY=${cookie}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 403 && error.response?.headers['x-csrf-token']) {
        const csrfToken = error.response.headers['x-csrf-token'];
        try {
          const retryResponse = await axios.patch(
            `${this.groupsURL}/v1/groups/${groupId}/users/${userId}`,
            { roleId: roleId },
            {
              headers: {
                'Cookie': `.ROBLOSECURITY=${cookie}`,
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
              }
            }
          );
          return retryResponse.data;
        } catch (retryError) {
          console.error('Rütbe değiştirme hatası (retry):', retryError.response?.data || retryError.message);
          return null;
        }
      }
      console.error('Rütbe değiştirme hatası:', error.response?.data || error.message);
      return null;
    }
  }

  // Kullanıcıyı gruptan yasakla (ROBLOX_COOKIE gerekli)
  async banUserFromGroup(userId, groupId, cookie) {
    try {
      const response = await axios.delete(
        `${this.groupsURL}/v1/groups/${groupId}/users/${userId}`,
        {
          headers: {
            'Cookie': `.ROBLOSECURITY=${cookie}`
          }
        }
      );
      return true;
    } catch (error) {
      if (error.response?.status === 403 && error.response?.headers['x-csrf-token']) {
        const csrfToken = error.response.headers['x-csrf-token'];
        try {
          const retryResponse = await axios.delete(
            `${this.groupsURL}/v1/groups/${groupId}/users/${userId}`,
            {
              headers: {
                'Cookie': `.ROBLOSECURITY=${cookie}`,
                'X-CSRF-TOKEN': csrfToken
              }
            }
          );
          return true;
        } catch (retryError) {
          console.error('Yasaklama hatası (retry):', retryError.response?.data || retryError.message);
          return false;
        }
      }
      console.error('Yasaklama hatası:', error.response?.data || error.message);
      return false;
    }
  }

  // Place ID'den Universe ID'yi al
  async getUniverseId(placeId) {
    try {
      const response = await axios.get(
        `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
      );
      return response.data.universeId;
    } catch (error) {
      console.error('Universe ID alınırken hata:', error.message);
      return null;
    }
  }

  // Oyun aktifliğini al (Place ID kullanarak)
  async getGameActivity(placeId) {
    try {
      // Place ID'yi Universe ID'ye çevir
      const universeId = await this.getUniverseId(placeId);
      if (!universeId) {
        return null;
      }

      const response = await axios.get(
        `${this.gamesURL}/v1/games?universeIds=${universeId}`
      );
      
      if (response.data.data && response.data.data.length > 0) {
        const game = response.data.data[0];
        return {
          playing: game.playing,
          visits: game.visits,
          maxPlayers: game.maxPlayers,
          name: game.name
        };
      }
      return null;
    } catch (error) {
      console.error('Oyun aktifliği alınırken hata:', error.message);
      return null;
    }
  }

  // Kullanıcı bilgilerini al
  async getUserInfo(userId) {
    try {
      const response = await axios.get(`${this.usersURL}/v1/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Kullanıcı bilgisi alınırken hata:', error.message);
      return null;
    }
  }

  // Kullanıcının profil açıklamasını kontrol et
  async verifyUserOwnership(userId, verificationCode) {
    try {
      const userInfo = await this.getUserInfo(userId);
      if (!userInfo || !userInfo.description) {
        return false;
      }
      
      // Profil açıklamasında doğrulama kodunu ara
      return userInfo.description.includes(verificationCode);
    } catch (error) {
      console.error('Hesap doğrulama hatası:', error.message);
      return false;
    }
  }

  // Grup katılma isteklerini getir
  async getJoinRequests(groupId, cookie) {
    try {
      const response = await axios.get(
        `${this.groupsURL}/v1/groups/${groupId}/join-requests?sortOrder=Desc&limit=100`,
        {
          headers: {
            'Cookie': `.ROBLOSECURITY=${cookie}`
          }
        }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Katılma istekleri alınırken hata:', error.message);
      return null;
    }
  }

  // Grup katılma isteğini kabul et
  async acceptJoinRequest(groupId, userId, cookie) {
    try {
      const response = await axios.post(
        `${this.groupsURL}/v1/groups/${groupId}/join-requests/users/${userId}`,
        {},
        {
          headers: {
            'Cookie': `.ROBLOSECURITY=${cookie}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return true;
    } catch (error) {
      if (error.response?.status === 403 && error.response?.headers['x-csrf-token']) {
        const csrfToken = error.response.headers['x-csrf-token'];
        try {
          const retryResponse = await axios.post(
            `${this.groupsURL}/v1/groups/${groupId}/join-requests/users/${userId}`,
            {},
            {
              headers: {
                'Cookie': `.ROBLOSECURITY=${cookie}`,
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
              }
            }
          );
          return true;
        } catch (retryError) {
          console.error('İstek kabul hatası (retry):', retryError.response?.data || retryError.message);
          return false;
        }
      }
      console.error('İstek kabul hatası:', error.response?.data || error.message);
      return false;
    }
  }

  // Grup katılma isteğini reddet
  async rejectJoinRequest(groupId, userId, cookie) {
    try {
      const response = await axios.delete(
        `${this.groupsURL}/v1/groups/${groupId}/join-requests/users/${userId}`,
        {
          headers: {
            'Cookie': `.ROBLOSECURITY=${cookie}`
          }
        }
      );
      return true;
    } catch (error) {
      if (error.response?.status === 403 && error.response?.headers['x-csrf-token']) {
        const csrfToken = error.response.headers['x-csrf-token'];
        try {
          const retryResponse = await axios.delete(
            `${this.groupsURL}/v1/groups/${groupId}/join-requests/users/${userId}`,
            {
              headers: {
                'Cookie': `.ROBLOSECURITY=${cookie}`,
                'X-CSRF-TOKEN': csrfToken
              }
            }
          );
          return true;
        } catch (retryError) {
          console.error('İstek red hatası (retry):', retryError.response?.data || retryError.message);
          return false;
        }
      }
      console.error('İstek red hatası:', error.response?.data || error.message);
      return false;
    }
  }
}

module.exports = new RobloxAPI();
