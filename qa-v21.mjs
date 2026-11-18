import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto('http://127.0.0.1:5186',{waitUntil:'networkidle'});
assert.deepEqual(await page.locator('[data-ui]').allTextContents(),JSON.parse(await fs.readFile('qa/v18/before/panels.json','utf8')));
const results=[];
for(const [width,height] of [[1440,900],[1920,1080],[1366,768]]){
 await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(600);
 const data=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,panels:[...document.querySelectorAll('.product-stage [data-ui]')].map(e=>({name:e.className,bottom:e.getBoundingClientRect().bottom,width:e.offsetWidth,height:e.offsetHeight,transform:getComputedStyle(e).transform})),cta:document.querySelector('.testar-cta').getBoundingClientRect().toJSON(),carouselTop:document.querySelector('.reference-carousel').getBoundingClientRect().top}));
 assert.equal(data.overflow,false);for(const p of data.panels)assert.ok(p.bottom<height);if(height>=900)assert.ok(data.cta.bottom<=height);assert.ok(data.cta.top>=Math.max(...data.panels.map(p=>p.bottom)));assert.ok(data.carouselTop>data.cta.bottom);
 await page.screenshot({path:`qa/v21/desktop-${width}.png`});results.push({width,height,...data});
}
await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>scrollTo(0,0));
await page.getByRole('button',{name:'Testar',exact:true}).click();await page.waitForTimeout(1000);assert.ok(page.url().endsWith('/'));await expect(page.locator('.testar-cta')).toBeInViewport();assert.equal(await page.locator('.testar-cta svg').count(),0);
await page.getByRole('link',{name:'TESTAR AGORA',exact:true}).click();await expect(page).toHaveURL('http://127.0.0.1:5186/testar');await expect(page.getByText('ESTADO PROVISÓRIO')).toBeVisible();await page.screenshot({path:'qa/v21/testar.png'});await page.reload();await expect(page.getByRole('heading')).toHaveText('Página de teste em preparação');await page.getByRole('link',{name:'Voltar ao site institucional'}).click();await expect(page.locator('.product-stage')).toBeVisible();
await page.getByRole('button',{name:'Assumir conversa',exact:true}).click();await expect(page.locator('.chat-controls')).toContainText('Retomar com IA');await page.getByRole('button',{name:'Retomar com IA',exact:true}).click();await page.locator('.conversation').nth(1).click();await expect(page.locator('.chat-heading')).toContainText('Rafael');
const box=await page.locator('.inbox-rig').boundingBox();await page.mouse.move(box.x+box.width-20,box.y+20);await page.waitForTimeout(500);assert.notEqual(await page.locator('.tilted-card__body').evaluate(e=>getComputedStyle(e).transform),'none');await page.mouse.move(0,0);await page.waitForTimeout(1800);assert.equal(await page.locator('.tilted-card__body').evaluate(e=>getComputedStyle(e).transform),'none');
assert.deepEqual(errors,[]);await fs.writeFile('qa/v21/results.json',JSON.stringify({results,errors,routeAndInteractions:'passed'},null,2));await browser.close();console.log('PASS: desktop geometry, CTA placement, nav scroll, /testar direct reload and return, inbox, handoff, Tilted Card, console');
