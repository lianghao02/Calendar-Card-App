import test from 'node:test';
import assert from 'node:assert/strict';
import {confirmAction,cancelConfirmation} from '../js/dialogs.js';
const nodes=new Map();
class Element extends EventTarget {
    constructor(){super();this.open=false;this.dataset={};this.textContent='';const classes=new Set();this.classList={add:x=>classes.add(x),remove:x=>classes.delete(x)};}
    showModal(){this.open=true;}
    close(){this.open=false;}
    focus(){document.activeElement=this;}
}
for(const id of ['confirm-dialog','confirm-title','confirm-message','confirm-yes','confirm-no'])nodes.set(id,new Element());
globalThis.document={getElementById:id=>nodes.get(id),activeElement:null};
test('返回取消操作，預設焦點位於非破壞性按鈕', async()=>{
    const result=confirmAction('刪除行程？','家人也會看到刪除結果','確認刪除');
    assert.equal(document.activeElement,nodes.get('confirm-no'));
    nodes.get('confirm-no').dispatchEvent(new Event('click'));
    assert.equal(await result,false);assert.equal(nodes.get('confirm-dialog').open,false);
});
test('使用者確認後才回傳核准，對話框關閉',async()=>{
    const result=confirmAction('捨棄草稿？','這次輸入不會保存','捨棄並關閉');
    assert.equal(nodes.get('confirm-yes').textContent,'捨棄並關閉');
    nodes.get('confirm-yes').dispatchEvent(new Event('click'));
    assert.equal(await result,true);assert.equal(nodes.get('confirm-dialog').open,false);
});
test('Escape 的 cancel 事件取消，不能視為核准',async()=>{
    const result=confirmAction('刪除行程？','請確認');
    const event=new Event('cancel',{cancelable:true});nodes.get('confirm-dialog').dispatchEvent(event);
    assert.equal(event.defaultPrevented,true);assert.equal(await result,false);
});
test('帳號變更或新的確認請求會取消原操作',async()=>{
    const first=confirmAction('刪除行程？','原帳號');
    const second=confirmAction('捨棄草稿？','新的操作');
    assert.equal(await first,false);cancelConfirmation();assert.equal(await second,false);
});
