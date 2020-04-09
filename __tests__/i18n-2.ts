import assert from 'assert';
import { i18n, changeCurrentLang } from '../test-fixtures/i18n-2/i18n';

test('i18n-2: multiple arguments', async () => {
  assert(i18n.gotAMail('Hanako', 'Happy Birthday!') === 'You got a mail! From:Hanako Subject:Happy Birthday!');
  assert(i18n.gotAMail('WB Store', 'Special Discount') === 'You got a mail! From:WB Store Subject:Special Discount');

  changeCurrentLang('ja');
  assert(i18n.gotAMail('花子', '誕生日おめでとう!') === 'メールを受信しました! 送信者:花子 件名:誕生日おめでとう!');
  assert(i18n.gotAMail('WB Store', '特別割引') === 'メールを受信しました! 送信者:WB Store 件名:特別割引');

  changeCurrentLang('en');
  assert(i18n.fourAnd('apple', 'orange', 'banana', 'peach') === 'apple, orange, banana and peach');

  changeCurrentLang('ja');
  assert(i18n.fourAnd('りんご', 'みかん', 'バナナ', 'モモ') === 'りんご と みかん と バナナ と モモ');
});
