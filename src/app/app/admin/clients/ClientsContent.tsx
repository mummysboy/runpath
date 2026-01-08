'use client';

import { useState } from 'react';
import Link from 'next/link';
import CreateClientForm from './CreateClientForm';

interface Client {
  id: string;
  name: string;
  status: string;
  billing_type: string;
  projects?: Array<{ count: number }>;
}

interface ClientsContentProps {
  clients: Client[];
  orgId: string;
}

export default function ClientsContent({ clients, orgId }: ClientsContentProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">Clients</h1>
            <p className="text-[#b7c1cf]">Manage clients and their projects</p>
          </div>
          <CreateClientForm 
            orgId={orgId} 
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients && clients.length > 0 ? (
            clients.map((client: any) => (
              <div
                key={client.id}
                className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 hover:border-[rgba(94,160,255,0.2)] transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[#f4f6fb]">{client.name}</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]">
                    {client.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-[#9eacc2]">Billing Type: </span>
                    <span className="text-[#d6dbe5] font-medium">{client.billing_type}</span>
                  </div>
                  <div>
                    <span className="text-[#9eacc2]">Projects: </span>
                    <span className="text-[#d6dbe5] font-medium">
                      {client.projects?.[0]?.count || 0}
                    </span>
                  </div>
                  <div className="pt-4 flex gap-2">
                    <Link
                      href={`/app/admin/clients/${client.id}`}
                      className="text-sm text-[#5ea0ff] hover:text-[#8fc2ff]"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <p className="text-[#9eacc2] mb-4">No clients found</p>
              <button 
                onClick={() => setIsFormOpen(true)}
                className="text-[#5ea0ff] hover:text-[#8fc2ff]"
              >
                Create your first client →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

