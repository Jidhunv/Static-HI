'use client';

import { use } from 'react';
import PropertyEditor from '../PropertyEditor';

export default function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PropertyEditor propertyId={id} />;
}
