import 'package:flutter/material.dart';
import 'package:conectaparana/shared/widgets/buttons/app_button.dart';
import 'package:conectaparana/shared/widgets/inputs/app_input.dart';
import 'package:conectaparana/shared/widgets/navigation/app_bottom_navigation.dart';
import 'package:conectaparana/shared/widgets/cards/app_card.dart';
import 'package:conectaparana/shared/widgets/navigation/app_header.dart';
import 'package:conectaparana/shared/widgets/misc/loading_spinner.dart';
import 'package:conectaparana/shared/widgets/misc/loading_skeleton.dart';
import 'package:conectaparana/shared/widgets/misc/empty_state.dart';
import 'package:conectaparana/shared/widgets/misc/avatar.dart';
import 'package:conectaparana/shared/widgets/misc/badge.dart';
import 'package:conectaparana/shared/widgets/misc/app_chip.dart';
import 'package:conectaparana/shared/widgets/feedback/app_toast.dart';
import 'package:conectaparana/shared/widgets/feedback/app_bottom_sheet.dart';
import 'package:conectaparana/shared/widgets/feedback/app_modal.dart';

class StyleguideScreen extends StatefulWidget {
  const StyleguideScreen({super.key});

  @override
  State<StyleguideScreen> createState() => _StyleguideScreenState();
}

class _StyleguideScreenState extends State<StyleguideScreen> {
  int _currentIndex = 0;
  bool _chipSelected = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F9F9),
      appBar: AppBar(
        title: const Text('Styleguide - Widgets', style: TextStyle(fontSize: 16)),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
      ),
      bottomNavigationBar: AppBottomNavigation(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text('Header', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          AppHeader(cityName: 'Maringá', onCityTap: () {}, onNotificationTap: () {}),
          const SizedBox(height: 12),
          AppHeader(cityName: 'Maringá', hasAlert: true, onCityTap: () {}, onNotificationTap: () {}),
          const SizedBox(height: 32),

          const Text('Botões Core', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          AppButton(label: 'Entrar', onPressed: () {}),
          const SizedBox(height: 12),
          AppButton(label: 'Continuar com Google', variant: AppButtonVariant.secondary, onPressed: () {}),
          const SizedBox(height: 12),
          AppButton(label: 'Ghost', variant: AppButtonVariant.ghost, onPressed: () {}),
          const SizedBox(height: 12),
          AppButton(label: 'Deletar Conta', variant: AppButtonVariant.destructive, onPressed: () {}),
          const SizedBox(height: 12),
          const AppButton(label: 'Carregando', isLoading: true),
          const SizedBox(height: 32),

          const Text('Inputs Core', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          const AppInput(label: 'E-MAIL', hint: 'seu@email.com'),
          const SizedBox(height: 12),
          const AppInput(label: 'SENHA', hint: 'Mínimo 8 caracteres', type: AppInputType.password),
          const SizedBox(height: 12),
          const AppInput(label: 'BUSCA', hint: 'Buscar serviços, locais...', type: AppInputType.search),
          const SizedBox(height: 12),
          const AppInput(label: 'COM ERRO', hint: 'seu@email.com', errorText: 'E-mail inválido'),
          const SizedBox(height: 12),
          AppInput(
            label: 'CIDADE',
            hint: 'Selecione sua cidade',
            type: AppInputType.dropdown,
            dropdownItems: const ['Maringá', 'Paicandu',],
            onDropdownChanged: (value) {},
          ),
          const SizedBox(height: 12),
          const AppInput(
            label: 'DATA',
            hint: 'DD/MM/AAAA',
            type: AppInputType.date,
          ),
          const SizedBox(height: 32),

          const Text('Cards Core', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          AppCard(variant: AppCardVariant.event, title: 'Aniversário de Maringá', label: '10 MAI · 18:00', subtitle: 'Praça da Catedral', onTap: () {}),
          const SizedBox(height: 12),
          AppCard(variant: AppCardVariant.announcement, title: 'Audiência pública sobre o orçamento de 2026', label: 'COMUNICADO · PARTICIPAÇÃO', subtitle: 'Câmara Municipal · 5h', onTap: () {}),
          const SizedBox(height: 12),
          AppCard(variant: AppCardVariant.news, title: 'Mutirão de limpeza nos rios urbanos retira 8 toneladas', label: 'NOTÍCIA · SUSTENTABILIDADE', subtitle: 'Secretaria do Meio Ambiente · 1d', onTap: () {}),
          const SizedBox(height: 12),
          AppCard(variant: AppCardVariant.local, title: 'UBS Zona 7', category: 'Unidade de Saúde', distance: '0,8 km', onTap: () {}),
          const SizedBox(height: 32),

          const Text('Misc', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          const Row(
            children: [
              LoadingSpinner(),
              SizedBox(width: 16),
              Avatar(name: 'Camila Souza'),
              SizedBox(width: 16),
              Avatar(name: 'Pedro Silva'),
            ],
          ),
          const SizedBox(height: 16),
          const LoadingSkeleton(height: 16),
          const SizedBox(height: 8),
          const LoadingSkeleton(height: 16, width: 200),
          const SizedBox(height: 8),
          const LoadingSkeleton(height: 100),
          const SizedBox(height: 16),
          const Row(
            children: [
              AppBadge(label: 'GRÁTIS'),
              SizedBox(width: 8),
              AppBadge(label: 'COMUNICADO', variant: AppBadgeVariant.orange),
              SizedBox(width: 8),
              AppBadge(label: 'NOTÍCIA', variant: AppBadgeVariant.teal),
              SizedBox(width: 8),
              AppBadge(label: 'ALERTA', variant: AppBadgeVariant.red),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              AppChip(label: 'Todos', isSelected: _chipSelected, onTap: () => setState(() => _chipSelected = !_chipSelected)),
              const SizedBox(width: 8),
              const AppChip(label: 'Hoje'),
              const SizedBox(width: 8),
              const AppChip(label: 'Esta semana'),
            ],
          ),
          const SizedBox(height: 32),

          const Text('Feedback', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          AppButton(label: 'Mostrar Toast Sucesso', onPressed: () => AppToast.show(context, message: 'Ação realizada com sucesso!', variant: AppToastVariant.success)),
          const SizedBox(height: 12),
          AppButton(label: 'Mostrar Toast Erro', variant: AppButtonVariant.destructive, onPressed: () => AppToast.show(context, message: 'Algo deu errado!', variant: AppToastVariant.error)),
          const SizedBox(height: 12),
          AppButton(
            label: 'Abrir Bottom Sheet',
            variant: AppButtonVariant.secondary,
            onPressed: () => AppBottomSheet.show(
              context,
              title: 'Opções',
              children: [
                const ListTile(leading: Icon(Icons.share), title: Text('Compartilhar')),
                const ListTile(leading: Icon(Icons.flag_outlined), title: Text('Denunciar')),
              ],
            ),
          ),
          const SizedBox(height: 12),
          AppButton(
            label: 'Abrir Modal',
            variant: AppButtonVariant.secondary,
            onPressed: () => AppModal.show(
              context,
              title: 'Deletar conta',
              message: 'Tem certeza que deseja deletar sua conta?',
              confirmLabel: 'Deletar',
              isDestructive: true,
            ),
          ),
          const SizedBox(height: 32),

          const Text('Empty State', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          const EmptyState(
            icon: Icons.event_busy,
            title: 'Nenhum evento encontrado',
            subtitle: 'Não há eventos disponíveis para essa data.',
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}