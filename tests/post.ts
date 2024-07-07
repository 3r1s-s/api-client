import { is_api_post, post } from '../src/interfaces/post.ts';
import { assertEquals, assertThrows, assertRejects } from 'jsr:@std/assert@0.226.0';
import { mockFetch } from 'jsr:@c4spar/mock-fetch@1.0.0';
import { post_is_api_post, bridged_post, regular_post } from './internal/post.ts';

Deno.test('api_post validation', async (i) => {
    await i.step('number (invalid)', () => {
        assertEquals(is_api_post(1), false);
    });

    await i.step('string (invalid)', () => {
        assertEquals(is_api_post('test'), false);
    });

    await i.step('empty object (invalid)', () => {
        assertEquals(is_api_post({}), false);
    });

    await i.step('post (valid, not bridged)', () => {
        assertEquals(is_api_post(regular_post), true);
    });

    await i.step('post (valid, bridged)', () => {
        assertEquals(is_api_post(bridged_post), true);
    });
});

Deno.test('post construction', async (i) => {
    await i.step('throw error if data is not a post', () => {
        assertThrows(() => {
            new post({
                api_url: 'http://localhost:8000',
                api_token: 'test',
                // @ts-ignore: intentionally passing an empty object
                data: {},
            });
        });
    });

    await i.step('construct valid post (not bridged)', () => {
        const p = new post({
            api_url: 'http://localhost:8000',
            api_token: 'test',
            data: regular_post,
        });

        post_is_api_post(p, regular_post);
    });

    await i.step('construct valid post (bridged)', () => {
        const p = new post({
            api_url: 'http://localhost:8000',
            api_token: 'test',
            data: bridged_post,
        });

        post_is_api_post(p, bridged_post);
    });
});

Deno.test('post pinning', async (i) => {
    const p = new post({
        api_url: 'http://localhost:8000',
        api_token: 'test',
        data: regular_post,
    });

    await i.step('pin (successful)', async () => {
        mockFetch('http://localhost:8000/posts/:id/pin', {
            body: JSON.stringify({
                ...regular_post,
                pinned: true,
            })
        })    

        await p.pin();

        assertEquals(p.pinned, true);
    });

    await i.step('unpin (successful)', async () => {
        mockFetch('http://localhost:8000/posts/:id/pin', {
            body: JSON.stringify({
                ...regular_post,
                pinned: false,
            })
        })

        await p.unpin();

        assertEquals(p.pinned, false);
    });

    await i.step('pin (failed)', async () => {
        mockFetch('http://localhost:8000/posts/:id/pin', {
            status: 404,
            body: JSON.stringify({
                error: true,
                type: 'notFound',
            })
        });

        await assertRejects(async () => {
            await p.pin();
        });
    });

    await i.step('unpin (failed)', async () => {
        mockFetch('http://localhost:8000/posts/:id/pin', {
            status: 404,
            body: JSON.stringify({
                error: true,
                type: 'notFound',
            })
        });

        await assertRejects(async () => {
            await p.unpin();
        });
    });
});

Deno.test('post deletion', async (i) => {
    const p = new post({
        api_url: 'http://localhost:8000',
        api_token: 'test',
        data: regular_post,
    });

    await i.step('delete (successful)', async () => {
        mockFetch('http://localhost:8000/posts/?id=:id', {
            status: 200
        });

        // this will fail if the call fails

        await p.delete();
    });

    await i.step('delete (failed)', async () => {
        mockFetch('http://localhost:8000/posts/?id=:id', {
            status: 404,
            body: JSON.stringify({
                error: true,
                type: 'notFound',
            })
        });

        await assertRejects(async () => {
            await p.delete();
        });
    });
})

Deno.test('post reporting', async (i) => {
    const p = new post({
        api_url: 'http://localhost:8000',
        api_token: 'test',
        data: regular_post,
    });

    await i.step('report (successful)', async () => {
        mockFetch('http://localhost:8000/posts/:id/report', {
            status: 200
        });

        // this will fail if the call fails

        await p.report({ reason: 'test', comment: 'test' });
    });

    await i.step('report (failed)', async () => {
        mockFetch('http://localhost:8000/posts/:id/report', {
            status: 404,
            body: JSON.stringify({
                error: true,
                type: 'notFound',
            })
        });

        await assertRejects(async () => {
            await p.report({ reason: 'test', comment: 'test' });
        });
    });
})