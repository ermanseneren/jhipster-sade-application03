import { computed, defineComponent, inject, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useVuelidate } from '@vuelidate/core';
import { email, helpers, maxLength, minLength, required, sameAs } from '@vuelidate/validators';
import type LoginService from '@/account/login.service';
import RegisterService from '@/account/register/register.service';
import { EMAIL_ALREADY_USED_TYPE, LOGIN_ALREADY_USED_TYPE } from '@/constants';

const loginPattern = helpers.regex(/^[a-zA-Z0-9!$&*+=?^_`{|}~.-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*$|^[_.@A-Za-z0-9-]+$/);

export default defineComponent({
  compatConfig: { MODE: 3 },
  name: 'Register',
  validations() {
    return {
      registerAccount: {
        login: {
          required,
          minLength: minLength(1),
          maxLength: maxLength(50),
          pattern: loginPattern,
        },
        email: {
          required,
          minLength: minLength(5),
          maxLength: maxLength(254),
          email,
        },
        password: {
          required,
          minLength: minLength(4),
          maxLength: maxLength(254),
        },
      },
      confirmPassword: {
        required,
        minLength: minLength(4),
        maxLength: maxLength(50),
        sameAsPassword: sameAs(this.registerAccount.password),
      },
    };
  },
  setup(prop) {
    const loginService = inject<LoginService>('loginService');
    const registerService = inject('registerService', () => new RegisterService(), true);
    const currentLanguage = inject('currentLanguage', () => computed(() => navigator.language ?? 'tr'), true);

    const error: Ref<string> = ref('');
    const errorEmailExists: Ref<string> = ref('');
    const errorUserExists: Ref<string> = ref('');
    const success: Ref<boolean> = ref(false);

    const confirmPassword: Ref<any> = ref(null);
    const registerAccount: Ref<any> = ref({
      login: undefined,
      email: undefined,
      password: undefined,
    });

    const openLogin = () => {
      loginService.openLogin();
    };

    return {
      openLogin,
      currentLanguage,
      registerService,
      error,
      errorEmailExists,
      errorUserExists,
      success,
      confirmPassword,
      registerAccount,
      v$: useVuelidate(),
      t$: useI18n().t,
    };
  },
  methods: {
    register(): void {
      this.error = null;
      this.errorUserExists = null;
      this.errorEmailExists = null;
      this.registerAccount.langKey = this.currentLanguage;
      this.registerService
        .processRegistration(this.registerAccount)
        .then(() => {
          this.success = true;
        })
        .catch(error => {
          this.success = null;
          if (error.response.status === 400 && error.response.data.type === LOGIN_ALREADY_USED_TYPE) {
            this.errorUserExists = 'ERROR';
          } else if (error.response.status === 400 && error.response.data.type === EMAIL_ALREADY_USED_TYPE) {
            this.errorEmailExists = 'ERROR';
          } else {
            this.error = 'ERROR';
          }
        });
    },
  },
});
