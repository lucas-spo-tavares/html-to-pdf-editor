import type { EditorDocument } from './types';

export const sampleDocument: EditorDocument = {
  title: 'Invoice template',
  unit: 'mm',
  page: {
    size: {
      name: 'A4',
      width: 210,
      height: 297,
    },
    orientation: 'portrait',
    margin: {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    },
    background: '#ffffff',
  },
  assets: [],
  contextText: JSON.stringify(
    {
      user: {
        name: 'Lucas',
        age: 32,
        is_active: true,
      },
      invoice: {
        number: 'INV-2026-001',
        total: 'R$ 120,00',
      },
      items: [
        { name: 'Produto A', price: 'R$ 70,00' },
        { name: 'Produto B', price: 'R$ 50,00' },
      ],
    },
    null,
    2,
  ),
  objects: [
    {
      id: 'header',
      name: 'Header',
      type: 'container',
      frame: { x: 16, y: 16, width: 178, height: 44 },
      style: {
        background: '#f8fafc',
        border: '1px solid #d0d5dd',
        borderRadius: 4,
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 2,
      },
      children: [
        {
          id: 'title',
          name: 'Title',
          type: 'text',
          frame: { x: 0, y: 0, width: 162, height: 12 },
          style: {
            color: '#101828',
            fontFamily: 'Inter',
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1.15,
          },
          content: 'Invoice {{ invoice.number }}',
        },
        {
          id: 'subtitle',
          name: 'Subtitle',
          type: 'text',
          frame: { x: 0, y: 16, width: 162, height: 10 },
          style: {
            color: '#475467',
            fontFamily: 'Inter',
            fontSize: 10,
            lineHeight: 1.35,
          },
          content: 'Client: {{ user.name }}',
        },
      ],
    },
    {
      id: 'active-note',
      name: 'Active note',
      type: 'text',
      frame: { x: 16, y: 72, width: 178, height: 16 },
      style: {
        background: '#ecfdf3',
        color: '#027a48',
        border: '1px solid #abefc6',
        borderRadius: 4,
        padding: 4,
        fontSize: 10,
        lineHeight: 1.25,
      },
      template: {
        if: 'user.is_active',
      },
      content: '{{ user.name }} is active and ready for billing.',
    },
    {
      id: 'items',
      name: 'Items loop',
      type: 'group',
      frame: { x: 16, y: 102, width: 178, height: 72 },
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      },
      template: {
        forEach: {
          item: 'item',
          collection: 'items',
        },
      },
      children: [
        {
          id: 'item-row',
          name: 'Item row',
          type: 'container',
          frame: { x: 0, y: 0, width: 178, height: 14 },
          style: {
            border: '1px solid #eaecf0',
            borderRadius: 3,
            padding: 4,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 10,
          },
          children: [
            {
              id: 'item-name',
              name: 'Item name',
              type: 'text',
              frame: { x: 0, y: 0, width: 120, height: 6 },
              style: {},
              content: '{{ item.name }}',
            },
            {
              id: 'item-price',
              name: 'Item price',
              type: 'text',
              frame: { x: 130, y: 0, width: 40, height: 6 },
              style: {
                textAlign: 'right',
                fontWeight: 700,
              },
              content: '{{ item.price }}',
            },
          ],
        },
      ],
    },
    {
      id: 'total',
      name: 'Total',
      type: 'text',
      frame: { x: 126, y: 190, width: 68, height: 18 },
      style: {
        color: '#101828',
        fontSize: 16,
        fontWeight: 700,
        textAlign: 'right',
      },
      content: 'Total {{ invoice.total }}',
    },
  ],
};
