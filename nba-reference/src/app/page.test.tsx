import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Page from './page';

test('renders page component', async () => {
    // Await the Server Component rendering
    const ServerPage = await Page();
    render(ServerPage);
    const linkElement = screen.getByText(/Basketball Stats and History/i);
    expect(linkElement).toBeInTheDocument();
});
