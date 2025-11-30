import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Komponens', () => {
  it('Megjeleníti a főcímet', () => {
    render(<App />);
    
    const headingElements = screen.getAllByText(/Bajnokság app/i);
    
    expect(headingElements.length).toBeGreaterThan(0);
  });

  it('Megjeleníti a navigációs gombokat', () => {
    render(<App />);
    
    const adminButtons = screen.getAllByText(/Admin bejelentkezés/i);
    
    expect(adminButtons.length).toBeGreaterThan(0);
    expect(adminButtons[0]).toBeInTheDocument();
  });
});