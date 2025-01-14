import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { ToastController, Platform } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from '../services/api.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  authState = new BehaviorSubject(false);

  userData;
  userToken;

  userNotifications;
  newNotifications;

  userWallet;

  deviceToken;

  notificationsCount;

  constructor(
    private router: Router,
    private storage: Storage,
    private platform: Platform,
    public toastController: ToastController,
    public apiService: ApiService,
    private _translate: TranslateService,
  ) {
    this.platform.ready().then(() => {
      this.ifLoggedIn();
    });
  }

  async ifLoggedIn() {
    await this.storage.get('PANDA_USER_INFO').then(response => {
      if (response) {
        this.authState.next(true);
      } else {
        this.authState.next(false);
      }
    });
  }

  async getDeviceToken() {
      
  }

  async doLogin(userFullData) {
    await this.storage.set('PANDA_USER_INFO', userFullData).then(response => {
      // this.router.navigate(['dashboard']);
      // console.log('From Login Function', response);
      this.authState.next(true);
      this.getUserData();
      this.storage
        .set('PANDA_USER_LANG', userFullData.user.language)
        .then(response2 => {
          this._translate.setDefaultLang(userFullData.user.language);
          console.log('From User Lang Storage', response2);
          this.getDeviceToken().then(() => {
            if (this.deviceToken) {
              this.apiService
                .postDeviceToken(this.userToken, this.deviceToken)
                .subscribe(
                  (resp: any) => {
                    // console.log(resp);
                  },
                  error => {
                    // console.log(error);
                  }
                );
            }
          });
        });
    });
  }

  getUserData() {
    if (this.authState) {
      return this.storage.get('PANDA_USER_INFO').then(response => {
        if (response) {
          this.userData = response.user;
          this.userToken = response.token;
        }
      });
    }
  }

  returnUserData() {
    return this.storage.get('PANDA_USER_INFO');
  }

  returnUserLang() {
    return this.storage.get('PANDA_USER_LANG');
  }

  async changeUserLang(lng: string) {
    await this.storage.set('PANDA_USER_LANG', lng).then(response2 => {
      this._translate.setDefaultLang(lng);
      document.documentElement.lang = lng;
      this.userData.language = lng;
      const userNewData = {
        token: this.userToken,
        user: this.userData
      };
      this.updateUserData(userNewData);
      this.apiService.defaultLang = lng;
      this.apiService
        .changeLang(this.userToken, lng)
        .subscribe((response: any) => {
          // console.log('change lang response: ', response);
        });
      // console.log('From User Lang Storage', response2);
    });
  }

  updateUserData(userData) {
    this.getUserData();
    this.storage.set('PANDA_USER_INFO', userData).then(response => {
      // this.router.navigate(['dashboard']);
      // console.log('From Update Function', response);
    });
  }

  async logout() {
    await this.storage.remove('PANDA_USER_INFO').then(() => {
      // this._translate.setDefaultLang('en');
      // document.documentElement.lang = 'en';
      // this.storage.remove('PANDA_USER_LANG');
      this.authState.next(false);
      this.router.navigate(['login']);
    });
  }

  isAuthenticated() {
    return this.authState.value;
  }

  async notificationCount(token) {
    this.apiService.getNotificationsCount(token).subscribe(
      (res: any) => {
        console.log(res);
        this.notificationsCount = res;
        console.log(this.notificationsCount);
      },
      error => {
        console.log(error);
      }
    );
  }

  async getNotifications(token, page?) {
    console.log(page);
    this.apiService.getUserNotifications(token, page ? page : 1).subscribe(
      (result: any) => {
        // console.log('User Notifications', result);
        if (!page || page === 1) {
          this.userNotifications = result;
          console.log(result);
        } else {
          console.log(result);
          this.userNotifications.push(...result);
        }
        const newNotif = result.filter(item => item.read === 0);
        // console.log(newNotif);
        this.newNotifications = newNotif;
      },
      error => {
        // console.log(error);
      }
    );
  }

  async reloadNotifications(token) {
    this.apiService.getUserNotifications(token).subscribe(
      (result: any) => {
        console.log('User Notifications', result);
        this.userNotifications = result;
        const newNotif = result.filter(item => item.read === 0);
        console.log(newNotif);
        this.newNotifications = newNotif;
      },
      error => {
        // console.log(error);
      }
    );
  }

  async getWallet(token) {
    this.apiService.getUserWallet(token).subscribe(
      (result: any) => {
        // console.log('User Wallet', result);
        this.userWallet = result;
      },
      error => {
        // console.log(error);
      }
    );
  }
}
